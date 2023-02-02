import 'react-native-url-polyfill/auto'
import React, {useState, useEffect} from 'react'
import {Linking} from 'react-native'
import {RootSiblingParent} from 'react-native-root-siblings'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import SplashScreen from 'react-native-splash-screen'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {SegmentClient, AnalyticsProvider} from '@segment/analytics-react-native'
import {ThemeProvider} from './view/lib/ThemeContext'
import * as view from './view/index'
import {RootStoreModel, setupState, RootStoreProvider} from './state'
import {MobileShell} from './view/shell/mobile'
import {s} from './view/lib/styles'
import notifee, {EventType} from '@notifee/react-native'
import {segmentClinet} from './lib/segmentClient'

const App = observer(() => {
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  )
  const [segment, setSegment] = useState<SegmentClient | undefined>(undefined)

  // init
  useEffect(() => {
    view.setup()
    setSegment(segmentClinet)
    setupState().then(store => {
      setRootStore(store)
      SplashScreen.hide()
      Linking.getInitialURL().then((url: string | null) => {
        if (url) {
          store.nav.handleLink(url)
        }
      })
      Linking.addEventListener('url', ({url}) => {
        store.nav.handleLink(url)
      })
      notifee.onForegroundEvent(async ({type}: {type: EventType}) => {
        store.log.debug('Notifee foreground event', {type})
        if (type === EventType.PRESS) {
          store.log.debug('User pressed a notifee, opening notifications')
          store.nav.switchTo(1, true)
        }
      })
    })
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }
  return (
    <GestureHandlerRootView style={s.h100pct}>
      <ThemeProvider theme={rootStore.shell.darkMode ? 'dark' : 'light'}>
        <RootSiblingParent>
          <AnalyticsProvider client={segment}>
            <RootStoreProvider value={rootStore}>
              <SafeAreaProvider>
                <MobileShell />
              </SafeAreaProvider>
            </RootStoreProvider>
          </AnalyticsProvider>
        </RootSiblingParent>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
})

export default App
