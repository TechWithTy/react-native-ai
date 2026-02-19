import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native'

export type PushPermissionSource = 'onboarding' | 'settings'
export type PushPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable'

type ExpoNotificationPermissions = {
  granted?: boolean
  status?: string
  canAskAgain?: boolean
}

const mapExpoPermissionStatus = (permission: ExpoNotificationPermissions): PushPermissionStatus => {
  if (permission.granted || permission.status === 'granted') return 'granted'
  if (permission.canAskAgain === false) return 'blocked'
  return 'denied'
}

const requestViaExpoNotifications = async (): Promise<PushPermissionStatus | null> => {
  try {
    // Optional dependency: if available, use the native Expo permissions API for both iOS and Android.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications')
    const current = (await Notifications.getPermissionsAsync?.()) as ExpoNotificationPermissions | undefined
    if (current && mapExpoPermissionStatus(current) === 'granted') return 'granted'

    const requested = (await Notifications.requestPermissionsAsync?.()) as
      | ExpoNotificationPermissions
      | undefined
    if (!requested) return 'unavailable'
    return mapExpoPermissionStatus(requested)
  } catch {
    return null
  }
}

const requestViaAndroidFallback = async (): Promise<PushPermissionStatus> => {
  if (Platform.OS !== 'android') return 'unavailable'
  if (typeof Platform.Version !== 'number' || Platform.Version < 33) return 'granted'

  try {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    const alreadyGranted = await PermissionsAndroid.check(permission)
    if (alreadyGranted) return 'granted'

    const result = await PermissionsAndroid.request(permission)
    if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted'
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked'
    return 'denied'
  } catch {
    return 'unavailable'
  }
}

const openSettingsPrompt = (source: PushPermissionSource) => {
  const context =
    source === 'onboarding'
      ? 'You can still finish setup, but you may miss job alerts.'
      : 'Push notifications stay off until permission is enabled.'

  Alert.alert(
    'Enable push notifications',
    `${context} Open system settings to allow notifications for Career Lift.`,
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Open settings',
        onPress: () => {
          void Linking.openSettings()
        },
      },
    ]
  )
}

export async function requestPushNotificationsPermission(
  source: PushPermissionSource
): Promise<PushPermissionStatus> {
  const expoResult = await requestViaExpoNotifications()
  const status = expoResult ?? (await requestViaAndroidFallback())

  if (status === 'blocked' || status === 'unavailable') {
    openSettingsPrompt(source)
  }

  return status
}
