export type MediaPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable'

type ImagePickerAsset = {
  uri: string
  width?: number
  height?: number
  type?: string
  fileName?: string
  mimeType?: string
}

type ImagePickerResponse = {
  canceled?: boolean
  assets?: ImagePickerAsset[]
}

type ImagePickerModule = {
  requestMediaLibraryPermissionsAsync?: () => Promise<{
    granted?: boolean
    status?: string
    canAskAgain?: boolean
  }>
  requestCameraPermissionsAsync?: () => Promise<{
    granted?: boolean
    status?: string
    canAskAgain?: boolean
  }>
  launchImageLibraryAsync?: (options?: Record<string, unknown>) => Promise<ImagePickerResponse>
  launchCameraAsync?: (options?: Record<string, unknown>) => Promise<ImagePickerResponse>
}

export type PickImageResult = {
  success: boolean
  canceled?: boolean
  status?: MediaPermissionStatus
  asset?: ImagePickerAsset
}

const getImagePickerModule = (): ImagePickerModule | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require('expo-image-picker') as ImagePickerModule
    return module ?? null
  } catch {
    return null
  }
}

const mapPermissionStatus = (permission: {
  granted?: boolean
  status?: string
  canAskAgain?: boolean
}): MediaPermissionStatus => {
  if (permission.granted || permission.status === 'granted') return 'granted'
  if (permission.canAskAgain === false) return 'blocked'
  return 'denied'
}

export async function requestMediaLibraryPermission(): Promise<MediaPermissionStatus> {
  const ImagePicker = getImagePickerModule()
  if (!ImagePicker?.requestMediaLibraryPermissionsAsync) return 'unavailable'

  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    return mapPermissionStatus(permission)
  } catch {
    return 'unavailable'
  }
}

export async function requestCameraPermission(): Promise<MediaPermissionStatus> {
  const ImagePicker = getImagePickerModule()
  if (!ImagePicker?.requestCameraPermissionsAsync) return 'unavailable'

  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    return mapPermissionStatus(permission)
  } catch {
    return 'unavailable'
  }
}

export async function pickImageFromLibrary(
  options: Record<string, unknown> = {}
): Promise<PickImageResult> {
  const ImagePicker = getImagePickerModule()
  if (!ImagePicker?.launchImageLibraryAsync) {
    return { success: false, status: 'unavailable' }
  }

  const permissionStatus = await requestMediaLibraryPermission()
  if (permissionStatus !== 'granted') {
    return { success: false, status: permissionStatus }
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync(options)
    if (result?.canceled || !result?.assets?.length) {
      return { success: false, canceled: true, status: 'granted' }
    }

    return {
      success: true,
      status: 'granted',
      asset: result.assets[0],
    }
  } catch {
    return { success: false, status: 'unavailable' }
  }
}

export async function captureImageWithCamera(
  options: Record<string, unknown> = {}
): Promise<PickImageResult> {
  const ImagePicker = getImagePickerModule()
  if (!ImagePicker?.launchCameraAsync) {
    return { success: false, status: 'unavailable' }
  }

  const permissionStatus = await requestCameraPermission()
  if (permissionStatus !== 'granted') {
    return { success: false, status: permissionStatus }
  }

  try {
    const result = await ImagePicker.launchCameraAsync(options)
    if (result?.canceled || !result?.assets?.length) {
      return { success: false, canceled: true, status: 'granted' }
    }

    return {
      success: true,
      status: 'granted',
      asset: result.assets[0],
    }
  } catch {
    return { success: false, status: 'unavailable' }
  }
}
