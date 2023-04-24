import React, {useMemo, useState} from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {Image, ImageStyle} from 'expo-image'
import {Dimensions} from 'lib/media/types'
import {AppBskyEmbedImages} from '@atproto/api'

export const DELAY_PRESS_IN = 500
const ACCESSIBILITY_ACTIONS = [
  {
    name: 'press',
    label: 'Press',
  },
  {name: 'longpress', label: 'Long press'},
]

interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export function ImageLayoutGrid({
  images,
  onPress,
  onLongPress,
  onPressIn,
  style,
}: ImageLayoutGridProps) {
  const [containerInfo, setContainerInfo] = useState<Dimensions | undefined>()

  const onLayout = (evt: LayoutChangeEvent) => {
    setContainerInfo({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    })
  }

  return (
    <View style={style} onLayout={onLayout}>
      {containerInfo ? (
        <ImageLayoutGridInner
          images={images}
          onPress={onPress}
          onPressIn={onPressIn}
          onLongPress={onLongPress}
          containerInfo={containerInfo}
        />
      ) : undefined}
    </View>
  )
}

interface ImageLayoutGridInnerProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  containerInfo: Dimensions
}

function ImageLayoutGridInner({
  images,
  onPress,
  onLongPress,
  onPressIn,
  containerInfo,
}: ImageLayoutGridInnerProps) {
  const count = images.length
  const size1 = useMemo<ImageStyle>(() => {
    if (count === 3) {
      const size = (containerInfo.width - 10) / 3
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [count, containerInfo])
  const size2 = React.useMemo<ImageStyle>(() => {
    if (count === 3) {
      const size = ((containerInfo.width - 10) / 3) * 2 + 5
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [count, containerInfo])

  if (count === 2) {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(0)}
          onPressIn={() => onPressIn?.(0)}
          onLongPress={() => onLongPress?.(0)}
          accessible={true}
          accessibilityLabel="Open first of two images"
          accessibilityHint="Opens image in viewer"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(0)
                break
              case 'longpress':
                onLongPress?.(0)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: images[0].thumb}}
            style={size1}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityLabel={images[0].alt}
            accessibilityHint={images[0].alt}
          />
        </TouchableOpacity>
        <View style={styles.wSpace} />
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(1)}
          onPressIn={() => onPressIn?.(1)}
          onLongPress={() => onLongPress?.(1)}
          accessibilityLabel="Open second of two images"
          accessibilityHint="Opens image in viewer"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(1)
                break
              case 'longpress':
                onLongPress?.(1)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: images[1].thumb}}
            style={size1}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityLabel={images[1].alt}
            accessibilityHint={images[1].alt}
          />
        </TouchableOpacity>
      </View>
    )
  }
  if (count === 3) {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(0)}
          onPressIn={() => onPressIn?.(0)}
          onLongPress={() => onLongPress?.(0)}
          accessibilityLabel="Open first of three images"
          accessibilityHint="Opens image in viewer"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(0)
                break
              case 'longpress':
                onLongPress?.(0)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: images[0].thumb}}
            style={size2}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityLabel={images[0].alt}
            accessibilityHint={images[0].alt}
          />
        </TouchableOpacity>
        <View style={styles.wSpace} />
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(1)}
            onPressIn={() => onPressIn?.(1)}
            onLongPress={() => onLongPress?.(1)}
            accessible={true}
            accessibilityLabel="Open second of three images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(1)
                  break
                case 'longpress':
                  onLongPress?.(1)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[1].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[1].alt}
              accessibilityHint={images[1].alt}
            />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(2)}
            onPressIn={() => onPressIn?.(2)}
            onLongPress={() => onLongPress?.(2)}
            accessible={true}
            accessibilityLabel="Open last of three images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(2)
                  break
                case 'longpress':
                  onLongPress?.(2)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[2].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[2].alt}
              accessibilityHint={images[2].alt}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  if (count === 4) {
    return (
      <View style={styles.flexRow}>
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(0)}
            onPressIn={() => onPressIn?.(0)}
            onLongPress={() => onLongPress?.(0)}
            accessible={true}
            accessibilityLabel="Open first of four images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(0)
                  break
                case 'longpress':
                  onLongPress?.(0)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[0].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[0].alt}
              accessibilityHint={images[0].alt}
            />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(2)}
            onPressIn={() => onPressIn?.(2)}
            onLongPress={() => onLongPress?.(2)}
            accessibilityLabel="Open second of four images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(2)
                  break
                case 'longpress':
                  onLongPress?.(2)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[2].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[2].alt}
              accessibilityHint={images[2].alt}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.wSpace} />
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(1)}
            onPressIn={() => onPressIn?.(1)}
            onLongPress={() => onLongPress?.(1)}
            accessible={true}
            accessibilityLabel="Open third of four images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(1)
                  break
                case 'longpress':
                  onLongPress?.(1)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[1].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[1].alt}
              accessibilityHint={images[1].alt}
            />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(3)}
            onPressIn={() => onPressIn?.(3)}
            onLongPress={() => onLongPress?.(3)}
            accessible={true}
            accessibilityLabel="Open last of four images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(3)
                  break
                case 'longpress':
                  onLongPress?.(3)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[3].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[3].alt}
              accessibilityHint={images[3].alt}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  return <View />
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row'},
  wSpace: {width: 5},
  hSpace: {height: 5},
})
