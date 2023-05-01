import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {makeAutoObservable, runInAction} from 'mobx'
import {POST_IMG_MAX} from 'lib/constants'
import * as ImageManipulator from 'expo-image-manipulator'
import {getDataUriSize, scaleDownDimensions} from 'lib/media/util'
import {openCropper} from 'lib/media/picker'
import {ActionCrop, FlipType, SaveFormat} from 'expo-image-manipulator'
import {Position} from 'react-avatar-editor'

// TODO: EXIF embed
// Cases to consider: ExternalEmbed

export interface ImageManipulationAttributes {
  rotate?: number
  scale?: number
  position?: Position
  flipHorizontal?: boolean
  flipVertical?: boolean
  aspectRatio?: '4:3' | '1:1' | '3:4' | 'None'
}

export class ImageModel implements RNImage {
  path: string
  mime = 'image/jpeg'
  width: number
  height: number
  size: number
  altText = ''
  cropped?: RNImage = undefined
  compressed?: RNImage = undefined
  scaledWidth: number = POST_IMG_MAX.width
  scaledHeight: number = POST_IMG_MAX.height

  // Web manipulation
  aspectRatio?: ImageManipulationAttributes['aspectRatio']
  position?: Position = undefined
  prev?: RNImage = undefined
  rotation?: number = 0
  scale?: number = 1
  flipHorizontal?: boolean = false
  flipVertical?: boolean = false

  prevAttributes: ImageManipulationAttributes = {}

  constructor(public rootStore: RootStoreModel, image: RNImage) {
    makeAutoObservable(this, {
      rootStore: false,
    })

    this.path = image.path
    this.width = image.width
    this.height = image.height
    this.size = image.size
    this.calcScaledDimensions()
  }

  get compressionFactor() {
    const MAX_IMAGE_SIZE_IN_BYTES = 976560

    return this.size < MAX_IMAGE_SIZE_IN_BYTES
      ? 1
      : MAX_IMAGE_SIZE_IN_BYTES / this.size
  }

  calcScaledDimensions() {
    const {width, height} = scaleDownDimensions(
      {width: this.width, height: this.height},
      POST_IMG_MAX,
    )
    this.scaledWidth = width
    this.scaledHeight = height
  }

  async setAltText(altText: string) {
    this.altText = altText
  }

  // Only for mobile
  async crop() {
    try {
      const cropped = await openCropper(this.rootStore, {
        mediaType: 'photo',
        path: this.path,
        freeStyleCropEnabled: true,
        width: this.scaledWidth,
        height: this.scaledHeight,
      })
      runInAction(() => {
        this.cropped = cropped
        this.compress()
      })
    } catch (err) {
      this.rootStore.log.error('Failed to crop photo', err)
    }
  }

  async compress() {
    try {
      const {width, height} = scaleDownDimensions(
        this.cropped
          ? {width: this.cropped.width, height: this.cropped.height}
          : {width: this.width, height: this.height},
        POST_IMG_MAX,
      )

      const compressed = await ImageManipulator.manipulateAsync(
        this.path,
        [
          {
            resize: {
              width,
              height,
            },
          },
        ],
        {compress: this.compressionFactor},
      )

      runInAction(() => {
        this.compressed = {
          mime: 'image/jpeg',
          path: compressed.uri,
          size: getDataUriSize(compressed.uri),
          ...compressed,
        }
      })
    } catch (err) {
      this.rootStore.log.error('Failed to compress photo', err)
    }
  }

  // Web manipulation
  async manipulate(
    attributes: {
      crop?: ActionCrop['crop']
    } & ImageManipulationAttributes,
  ) {
    const {aspectRatio, crop, flipHorizontal, flipVertical, rotate, scale} =
      attributes
    const modifiers = []

    if (flipHorizontal !== undefined) {
      this.flipHorizontal = flipHorizontal
    }

    if (flipVertical !== undefined) {
      this.flipVertical = flipVertical
    }

    if (this.flipHorizontal) {
      modifiers.push({flip: FlipType.Horizontal})
    }

    if (this.flipVertical) {
      modifiers.push({flip: FlipType.Vertical})
    }

    // Leaving in here but don't think it's actually functional
    if (rotate !== undefined) {
      this.rotation = rotate
    }

    if (this.rotation !== undefined) {
      modifiers.push({rotate: this.rotation})
    }

    if (crop !== undefined) {
      modifiers.push({
        crop: {
          originX: crop.originX * this.width,
          originY: crop.originY * this.height,
          height: crop.height * this.height,
          width: crop.width * this.width,
        },
      })
    }

    if (scale !== undefined) {
      this.scale = scale
    }

    if (aspectRatio !== undefined) {
      this.aspectRatio = aspectRatio
    }

    const result = await ImageManipulator.manipulateAsync(
      this.path,
      modifiers,
      {compress: this.compressionFactor, format: SaveFormat.JPEG},
    )

    runInAction(() => {
      this.compressed = {
        mime: 'image/jpeg',
        path: result.uri,
        size: getDataUriSize(result.uri),
        ...result,
      }
    })
  }

  previous() {
    this.compressed = this.prev

    const {flipHorizontal, flipVertical, rotate, position, scale} =
      this.prevAttributes

    this.scale = scale
    this.rotation = rotate
    this.flipHorizontal = flipHorizontal
    this.flipVertical = flipVertical
    this.position = position
  }
}
