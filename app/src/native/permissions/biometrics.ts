import { Platform } from 'react-native'

type LocalAuthenticationModule = {
  AuthenticationType?: {
    FACIAL_RECOGNITION?: number
  }
  hasHardwareAsync?: () => Promise<boolean>
  isEnrolledAsync?: () => Promise<boolean>
  supportedAuthenticationTypesAsync?: () => Promise<number[]>
  authenticateAsync?: (options?: Record<string, unknown>) => Promise<{ success: boolean }>
}

export type FaceIdAvailabilityResult = {
  available: boolean
  reason?: string
}

const getLocalAuthenticationModule = (): LocalAuthenticationModule | null => {
  try {
    // Runtime optional dependency so this app does not crash if install is incomplete.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require('expo-local-authentication') as LocalAuthenticationModule
    return module ?? null
  } catch {
    return null
  }
}

export async function checkFaceIdAvailability(): Promise<FaceIdAvailabilityResult> {
  const LocalAuthentication = getLocalAuthenticationModule()
  if (!LocalAuthentication) {
    return {
      available: false,
      reason: 'Local authentication module is unavailable in this build.',
    }
  }

  if (
    !LocalAuthentication.hasHardwareAsync ||
    !LocalAuthentication.isEnrolledAsync ||
    !LocalAuthentication.authenticateAsync
  ) {
    return {
      available: false,
      reason: 'Local authentication APIs are not fully available.',
    }
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  if (!hasHardware) {
    return {
      available: false,
      reason: 'This device does not support biometric authentication.',
    }
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  if (!isEnrolled) {
    return {
      available: false,
      reason: 'Set up Face ID or biometric unlock in your device settings first.',
    }
  }

  if (Platform.OS === 'ios' && LocalAuthentication.supportedAuthenticationTypesAsync) {
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
    const faceIdType = LocalAuthentication.AuthenticationType?.FACIAL_RECOGNITION ?? 2
    if (!supportedTypes.includes(faceIdType)) {
      return {
        available: false,
        reason: 'This iOS device does not have Face ID enabled.',
      }
    }
  }

  return { available: true }
}

export async function promptFaceIdAuthentication(): Promise<boolean> {
  const LocalAuthentication = getLocalAuthenticationModule()
  if (!LocalAuthentication?.authenticateAsync) return false

  const authResult = await LocalAuthentication.authenticateAsync({
    promptMessage: Platform.OS === 'ios' ? 'Enable Face ID' : 'Enable biometric sign-in',
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use Passcode',
  })

  return !!authResult.success
}
