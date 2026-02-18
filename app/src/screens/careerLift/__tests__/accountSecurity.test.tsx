import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { SettingsProfileScreen } from '../settingsProfile'
import { AccountSecurityScreen } from '../accountSecurity'
import { NotificationsPreferencesScreen } from '../notificationPreferences'
import { UpdatePasswordScreen } from '../updatePassword'
import { UpdateEmailScreen } from '../updateEmail'
import { useUserProfileStore } from '../../../store/userProfileStore'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockGetDocumentAsync = jest.fn()
const mockRequestForegroundPermissionsAsync = jest.fn()
const mockGetCurrentPositionAsync = jest.fn()
const mockReverseGeocodeAsync = jest.fn()
const mockHasHardwareAsync = jest.fn()
const mockIsEnrolledAsync = jest.fn()
const mockSupportedAuthenticationTypesAsync = jest.fn()
const mockAuthenticateAsync = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  FontAwesome5: 'FontAwesome5',
  Ionicons: 'Ionicons',
  Feather: 'Feather',
}))

jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {
    ExpoLocalAuthentication: {
      AuthenticationType: {
        FACIAL_RECOGNITION: 2,
      },
      hasHardwareAsync: (...args: unknown[]) => mockHasHardwareAsync(...args),
      isEnrolledAsync: (...args: unknown[]) => mockIsEnrolledAsync(...args),
      supportedAuthenticationTypesAsync: (...args: unknown[]) =>
        mockSupportedAuthenticationTypesAsync(...args),
      authenticateAsync: (...args: unknown[]) => mockAuthenticateAsync(...args),
    },
  },
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}))

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
  reverseGeocodeAsync: (...args: unknown[]) => mockReverseGeocodeAsync(...args),
}))

jest.mock('country-state-city', () => ({
  City: {
    getCitiesOfCountry: () => [],
  },
  State: {
    getStatesOfCountry: () => [],
  },
}))

jest.mock('../subscriptionModal', () => {
  const { View } = require('react-native')
  return {
    SubscriptionModal: ({ visible }: { visible: boolean }) =>
      visible ? <View testID='subscription-modal' /> : null,
  }
})

jest.spyOn(Alert, 'alert')

describe('Account and security flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useUserProfileStore.getState().resetProfile()
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: [] })
    mockHasHardwareAsync.mockResolvedValue(true)
    mockIsEnrolledAsync.mockResolvedValue(true)
    mockSupportedAuthenticationTypesAsync.mockResolvedValue([2])
    mockAuthenticateAsync.mockResolvedValue({ success: true })
  })

  it('opens AccountSecurity from settings profile privacy section', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Account & Security'))
    expect(mockNavigate).toHaveBeenCalledWith('AccountSecurity')
  })

  it('opens NotificationsPreferences from settings profile privacy section', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Notifications'))
    expect(mockNavigate).toHaveBeenCalledWith('NotificationsPreferences')
  })

  it('opens DocumentsInsights from settings profile privacy section', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Documents & Insights'))
    expect(mockNavigate).toHaveBeenCalledWith('DocumentsInsights')
  })

  it('opens UpdatePassword from Change Password row', () => {
    const { getByText } = render(<AccountSecurityScreen />)
    fireEvent.press(getByText('Change Password'))
    expect(mockNavigate).toHaveBeenCalledWith('UpdatePassword')
  })

  it('opens UpdateEmail from Email row', () => {
    const { getByText } = render(<AccountSecurityScreen />)
    fireEvent.press(getByText('Email'))
    expect(mockNavigate).toHaveBeenCalledWith('UpdateEmail')
  })

  it('verifies phone number from login and security section', () => {
    const { getByText, getByTestId } = render(<AccountSecurityScreen />)

    fireEvent.press(getByText('Phone Number'))
    expect(getByTestId('phone-setup-modal')).toBeTruthy()

    fireEvent.changeText(getByTestId('phone-number-input'), '(415) 555-1177')
    fireEvent.press(getByTestId('phone-send-code-button'))
    fireEvent.changeText(getByTestId('phone-code-input'), '482913')
    fireEvent.press(getByTestId('phone-verify-button'))

    expect(useUserProfileStore.getState().notificationPhoneVerified).toBe(true)
    expect(useUserProfileStore.getState().notificationPhoneNumber).toContain('(415) 555-1177')
  })

  it('renders notification channels including push and updates preference state', () => {
    const { getByText, getByTestId } = render(<NotificationsPreferencesScreen />)

    expect(getByText('Notification Preferences')).toBeTruthy()
    expect(getByText('Push')).toBeTruthy()

    fireEvent(getByTestId('pref-newScanReady-push-toggle'), 'valueChange', false)
    expect(useUserProfileStore.getState().notificationPreferences.newScanReady.push).toBe(false)
  })

  it('navigates to AccountSecurity when tapping Manage phone number', () => {
    const { getByText } = render(<NotificationsPreferencesScreen />)
    fireEvent.press(getByText('Manage'))
    expect(mockNavigate).toHaveBeenCalledWith('AccountSecurity')
  })

  it('enables SMS 2FA directly when phone is already verified', () => {
    const { getByTestId } = render(<AccountSecurityScreen />)

    fireEvent(getByTestId('twofa-toggle'), 'valueChange', true)
    expect(getByTestId('twofa-setup-modal')).toBeTruthy()

    fireEvent.press(getByTestId('twofa-method-sms'))
    fireEvent.press(getByTestId('twofa-enable-button'))

    expect(useUserProfileStore.getState().twoFactorAuth).toEqual(
      expect.objectContaining({
        enabled: true,
        method: 'sms',
      })
    )
  })

  it('requires phone verification before SMS 2FA when phone is unverified', () => {
    useUserProfileStore.getState().setProfile({
      notificationPhoneVerified: false,
    })

    const { getByTestId, getByText } = render(<AccountSecurityScreen />)
    fireEvent(getByTestId('twofa-toggle'), 'valueChange', true)
    fireEvent.press(getByTestId('twofa-method-sms'))
    fireEvent.press(getByTestId('twofa-enable-button'))

    expect(
      getByText('Verify a phone number in Login & Security before enabling SMS 2FA.')
    ).toBeTruthy()
  })

  it('enables 2FA with authenticator app code', () => {
    const { getByTestId } = render(<AccountSecurityScreen />)

    fireEvent(getByTestId('twofa-toggle'), 'valueChange', true)
    fireEvent.press(getByTestId('twofa-method-authenticator'))
    fireEvent.changeText(getByTestId('twofa-auth-code-input'), '135790')
    fireEvent.press(getByTestId('twofa-enable-button'))

    expect(useUserProfileStore.getState().twoFactorAuth).toEqual({
      enabled: true,
      method: 'authenticator',
      phoneNumber: null,
    })
  })

  it('enables Face ID after biometric verification succeeds', async () => {
    const { getByTestId } = render(<AccountSecurityScreen />)

    fireEvent(getByTestId('faceid-toggle'), 'valueChange', true)

    await waitFor(() => {
      expect(useUserProfileStore.getState().faceIdAuthEnabled).toBe(true)
    })
    expect(mockAuthenticateAsync).toHaveBeenCalled()
  })

  it('does not enable Face ID when biometric verification fails', async () => {
    mockAuthenticateAsync.mockResolvedValueOnce({ success: false })
    const { getByTestId } = render(<AccountSecurityScreen />)

    fireEvent(getByTestId('faceid-toggle'), 'valueChange', true)

    await waitFor(() => {
      expect(useUserProfileStore.getState().faceIdAuthEnabled).toBe(false)
    })
  })

  it('sends verification code and updates stored email on successful verify', () => {
    const { getByTestId } = render(<UpdateEmailScreen />)

    fireEvent.changeText(getByTestId('new-email-input'), 'new.email@example.com')
    fireEvent.press(getByTestId('send-code-button'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Verification Code Sent',
      expect.stringContaining('new.email@example.com')
    )

    fireEvent.changeText(getByTestId('verification-code-input'), '246810')
    fireEvent.press(getByTestId('verify-email-button'))

    expect(useUserProfileStore.getState().email).toBe('new.email@example.com')
    expect(Alert.alert).toHaveBeenCalledWith(
      'Email Updated',
      expect.stringContaining('updated successfully'),
      expect.any(Array)
    )
  })

  it('blocks verify step when code is incorrect', () => {
    const { getByTestId, getByText } = render(<UpdateEmailScreen />)

    fireEvent.changeText(getByTestId('new-email-input'), 'next.email@example.com')
    fireEvent.press(getByTestId('send-code-button'))
    fireEvent.changeText(getByTestId('verification-code-input'), '000000')
    fireEvent.press(getByTestId('verify-email-button'))

    expect(getByText('Invalid verification code. Please try again.')).toBeTruthy()
    expect(useUserProfileStore.getState().email).toBe('alex.mercer@example.com')
  })

  it('validates and submits password update when requirements are met', () => {
    const { getByTestId } = render(<UpdatePasswordScreen />)

    fireEvent.changeText(getByTestId('current-password-input'), 'OldSecurePass!12')
    fireEvent.changeText(getByTestId('new-password-input'), 'NewSecurePass!45')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewSecurePass!45')

    const submit = getByTestId('update-password-button')
    fireEvent.press(submit)
    expect(Alert.alert).toHaveBeenCalledWith(
      'Password Updated',
      expect.stringContaining('updated'),
      expect.any(Array)
    )
  })

  it('prevents submit when password rules are not satisfied', () => {
    const { getByTestId, getByText } = render(<UpdatePasswordScreen />)

    fireEvent.changeText(getByTestId('current-password-input'), 'OldSecurePass!12')
    fireEvent.changeText(getByTestId('new-password-input'), 'short')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'short')

    const submit = getByTestId('update-password-button')
    fireEvent.press(submit)
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(getByText('Your new password does not meet all requirements.')).toBeTruthy()
  })
})
