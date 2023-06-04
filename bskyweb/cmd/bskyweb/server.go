package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	appbsky "github.com/bluesky-social/indigo/api/bsky"
	cliutil "github.com/bluesky-social/indigo/cmd/gosky/util"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/bluesky-social/social-app/bskyweb"

	"github.com/flosch/pongo2/v6"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
)

type Server struct {
	xrpcc *xrpc.Client
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	pdsHost := cctx.String("pds-host")
	atpHandle := cctx.String("handle")
	atpPassword := cctx.String("password")
	mailmodoAPIKey := cctx.String("mailmodo-api-key")
	mailmodoListName := cctx.String("mailmodo-list-name")

	// Mailmodo client.
	mailmodo := NewMailmodo(mailmodoAPIKey)

	// create a new session
	// TODO: does this work with no auth at all?
	xrpcc := &xrpc.Client{
		Client: cliutil.NewHttpClient(),
		Host:   pdsHost,
		Auth: &xrpc.AuthInfo{
			Handle: atpHandle,
		},
	}

	auth, err := comatproto.ServerCreateSession(context.TODO(), xrpcc, &comatproto.ServerCreateSession_Input{
		Identifier: xrpcc.Auth.Handle,
		Password:   atpPassword,
	})
	if err != nil {
		return err
	}
	xrpcc.Auth.AccessJwt = auth.AccessJwt
	xrpcc.Auth.RefreshJwt = auth.RefreshJwt
	xrpcc.Auth.Did = auth.Did
	xrpcc.Auth.Handle = auth.Handle

	server := Server{xrpcc}

	staticHandler := http.FileServer(func() http.FileSystem {
		if debug {
			return http.FS(os.DirFS("static"))
		}
		fsys, err := fs.Sub(bskyweb.StaticFS, "static")
		if err != nil {
			log.Fatal(err)
		}
		return http.FS(fsys)
	}())

	e := echo.New()
	e.HideBanner = true
	// SECURITY: Do not modify without due consideration.
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		ContentTypeNosniff: "nosniff",
		XFrameOptions:      "SAMEORIGIN",
		HSTSMaxAge:         31536000, // 365 days
		// TODO:
		// ContentSecurityPolicy
		// XSSProtection
	}))
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		// Don't log requests for static content.
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/static")
		},
		Format: "method=${method} path=${uri} status=${status} latency=${latency_human}\n",
	}))
	e.Renderer = NewRenderer("templates/", &bskyweb.TemplateFS, debug)
	e.HTTPErrorHandler = customHTTPErrorHandler

	// redirect trailing slash to non-trailing slash.
	// all of our current endpoints have no trailing slash.
	e.Use(middleware.RemoveTrailingSlashWithConfig(middleware.TrailingSlashConfig{
		RedirectCode: http.StatusFound,
	}))

	// configure routes
	e.GET("/robots.txt", echo.WrapHandler(staticHandler))
	e.GET("/static/*", echo.WrapHandler(http.StripPrefix("/static/", staticHandler)))
	e.GET("/", server.WebHome)

	// generic routes
	e.GET("/search", server.WebGeneric)
	e.GET("/notifications", server.WebGeneric)
	e.GET("/moderation", server.WebGeneric)
	e.GET("/moderation/mute-lists", server.WebGeneric)
	e.GET("/moderation/mute-keywords", server.WebGeneric)
	e.GET("/moderation/muted-accounts", server.WebGeneric)
	e.GET("/moderation/blocked-accounts", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)
	e.GET("/settings/app-passwords", server.WebGeneric)
	e.GET("/sys/debug", server.WebGeneric)
	e.GET("/sys/log", server.WebGeneric)
	e.GET("/support", server.WebGeneric)
	e.GET("/support/privacy", server.WebGeneric)
	e.GET("/support/tos", server.WebGeneric)
	e.GET("/support/community-guidelines", server.WebGeneric)
	e.GET("/support/copyright", server.WebGeneric)

	// profile endpoints; only first populates info
	e.GET("/profile/:handle", server.WebProfile)
	e.GET("/profile/:handle/follows", server.WebGeneric)
	e.GET("/profile/:handle/followers", server.WebGeneric)
	e.GET("/profile/:handle/lists/:rkey", server.WebGeneric)

	// post endpoints; only first populates info
	e.GET("/profile/:handle/post/:rkey", server.WebPost)
	e.GET("/profile/:handle/post/:rkey/liked-by", server.WebGeneric)
	e.GET("/profile/:handle/post/:rkey/reposted-by", server.WebGeneric)

	// Mailmodo
	e.POST("/api/waitlist", func(c echo.Context) error {
		type jsonError struct {
			Error string `json:"error"`
		}

		// Read the API request.
		type apiRequest struct {
			Email string `json:"email"`
		}

		bodyReader := http.MaxBytesReader(c.Response(), c.Request().Body, 16*1024)
		payload, err := ioutil.ReadAll(bodyReader)
		if err != nil {
			return err
		}
		var req apiRequest
		if err := json.Unmarshal(payload, &req); err != nil {
			return c.JSON(http.StatusBadRequest, jsonError{Error: "Invalid API request"})
		}

		if req.Email == "" {
			return c.JSON(http.StatusBadRequest, jsonError{Error: "Please enter a valid email address."})
		}

		if err := mailmodo.AddToList(c.Request().Context(), mailmodoListName, req.Email); err != nil {
			log.Errorf("adding email to waitlist failed: %s", err)
			return c.JSON(http.StatusBadRequest, jsonError{
				Error: "Storing email in waitlist failed. Please enter a valid email address.",
			})
		}
		return c.JSON(http.StatusOK, map[string]bool{"success": true})
	})

	log.Infof("starting server address=%s", httpAddress)
	return e.Start(httpAddress)
}

func customHTTPErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}
	c.Logger().Error(err)
	data := pongo2.Context{
		"statusCode": code,
	}
	c.Render(code, "error.html", data)
}

// handler for endpoint that have no specific server-side handling
func (srv *Server) WebGeneric(c echo.Context) error {
	data := pongo2.Context{}
	return c.Render(http.StatusOK, "base.html", data)
}

func (srv *Server) WebHome(c echo.Context) error {
	data := pongo2.Context{}
	return c.Render(http.StatusOK, "home.html", data)
}

func (srv *Server) WebPost(c echo.Context) error {
	data := pongo2.Context{}
	handle := c.Param("handle")
	rkey := c.Param("rkey")
	// sanity check argument
	if len(handle) > 4 && len(handle) < 128 && len(rkey) > 0 {
		ctx := c.Request().Context()
		// requires two fetches: first fetch profile (!)
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle)
		if err != nil {
			log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		} else {
			did := pv.Did
			data["did"] = did

			// then fetch the post thread (with extra context)
			uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", did, rkey)
			tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, uri)
			if err != nil {
				log.Warnf("failed to fetch post: %s\t%v", uri, err)
			} else {
				req := c.Request()
				postView := tpv.Thread.FeedDefs_ThreadViewPost.Post
				data["postView"] = postView
				data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
				if postView.Embed != nil && postView.Embed.EmbedImages_View != nil {
					data["imgThumbUrl"] = postView.Embed.EmbedImages_View.Images[0].Thumb
				}
			}
		}

	}
	return c.Render(http.StatusOK, "post.html", data)
}

func (srv *Server) WebProfile(c echo.Context) error {
	data := pongo2.Context{}
	handle := c.Param("handle")
	// sanity check argument
	if len(handle) > 4 && len(handle) < 128 {
		ctx := c.Request().Context()
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle)
		if err != nil {
			log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		} else {
			req := c.Request()
			data["profileView"] = pv
			data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
		}
	}

	return c.Render(http.StatusOK, "profile.html", data)
}
