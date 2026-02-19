import type { NativeCapabilityKey } from './types'

export const NATIVE_CAPABILITY_USAGE_MAP: Record<NativeCapabilityKey, string[]> = {
  push_notifications: [
    'src/utils/pushNotificationsPermission.ts',
    'src/screens/careerLift/notificationPreferences.tsx',
    'src/screens/careerLift/ResumeIngestionScreen.tsx',
  ],
  location_foreground: [
    'src/native/permissions/location.ts',
    'src/screens/careerLift/onboardingGoals.tsx',
    'src/screens/careerLift/settingsProfile.tsx',
  ],
  document_picker: [
    'src/screens/assistant.tsx',
    'src/screens/careerLift/dashboard.tsx',
    'src/screens/careerLift/linkedInKit.tsx',
    'src/screens/careerLift/documentsInsights.tsx',
  ],
  media_library: [
    'src/native/permissions/media.ts',
    'src/screens/images.tsx',
  ],
  camera_capture: [
    'src/native/permissions/media.ts',
  ],
  microphone_recording: [
    'src/screens/careerLift/mockInterview.tsx',
  ],
  speech_synthesis: [
    'src/screens/careerLift/mockInterview.tsx',
  ],
  clipboard: [
    'src/screens/chat.tsx',
    'src/screens/images.tsx',
    'src/screens/careerLift/jobDetails.tsx',
    'src/screens/careerLift/jobTracker.tsx',
    'src/screens/careerLift/outreachCenter.tsx',
  ],
  biometric_auth: [
    'src/native/permissions/biometrics.ts',
    'src/screens/careerLift/accountSecurity.tsx',
  ],
}
