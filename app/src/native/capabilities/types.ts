export type NativePlatform = 'ios' | 'android' | 'web'

export type NativeCapabilityKey =
  | 'push_notifications'
  | 'location_foreground'
  | 'document_picker'
  | 'media_library'
  | 'camera_capture'
  | 'microphone_recording'
  | 'speech_synthesis'
  | 'clipboard'
  | 'biometric_auth'

export type NativeCapabilityStatus = 'enabled' | 'partial' | 'planned'

export type NativeCapabilityDefinition = {
  key: NativeCapabilityKey
  label: string
  packageName: string
  status: NativeCapabilityStatus
  platforms: NativePlatform[]
  androidPermissions?: string[]
  iosPermissionKeys?: string[]
  usage: string[]
  notes?: string
}
