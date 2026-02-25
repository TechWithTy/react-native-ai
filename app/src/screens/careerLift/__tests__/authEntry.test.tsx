import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { AuthEntryScreen } from '../authEntry'
import { ForgotPasswordScreen } from '../forgotPassword'
import { ForgotEmailScreen } from '../forgotEmail'
import { useUserProfileStore } from '../../../store/userProfileStore'

describe('Auth entry and recovery flows', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useUserProfileStore.getState().resetProfile()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('registers with email and routes to onboarding', () => {
    const { getByTestId } = render(<AuthEntryScreen navigation={navigation} />)

    fireEvent.press(getByTestId('auth-mode-signup'))
    fireEvent.press(getByTestId('auth-contact-email'))
    fireEvent.changeText(getByTestId('auth-first-name-input'), 'Tyriq')
    fireEvent.changeText(getByTestId('auth-last-name-input'), 'Stark')
    fireEvent.changeText(getByTestId('auth-email-input'), 'tyriq@example.com')
    fireEvent.press(getByTestId('auth-send-verification-code'))
    fireEvent.changeText(getByTestId('auth-verification-code-input'), '482913')
    fireEvent.press(getByTestId('auth-verify-code-button'))
    fireEvent.changeText(getByTestId('auth-password-input'), 'SecurePass123!')
    fireEvent.changeText(getByTestId('auth-confirm-password-input'), 'SecurePass123!')
    fireEvent.press(getByTestId('auth-submit-button'))

    expect(useUserProfileStore.getState().name).toBe('Tyriq Stark')
    expect(useUserProfileStore.getState().firstName).toBe('Tyriq')
    expect(useUserProfileStore.getState().lastName).toBe('Stark')
    expect(useUserProfileStore.getState().email).toBe('tyriq@example.com')
    expect(useUserProfileStore.getState().isAuthenticated).toBe(true)
    expect(useUserProfileStore.getState().authMethod).toBe('email')
    expect(useUserProfileStore.getState().lastAuthenticatedAt).toBeTruthy()
    expect(navigation.navigate).toHaveBeenCalledWith('OnboardingGoals')
  })

  it('signs in with phone and routes to main tabs', () => {
    const { getByTestId } = render(<AuthEntryScreen navigation={navigation} />)

    fireEvent.press(getByTestId('auth-mode-signin'))
    fireEvent.press(getByTestId('auth-contact-phone'))
    fireEvent.changeText(getByTestId('auth-phone-input'), '+1 (512) 555-0199')
    fireEvent.changeText(getByTestId('auth-password-input'), 'SecurePass123')
    fireEvent.press(getByTestId('auth-submit-button'))

    expect(useUserProfileStore.getState().notificationPhoneNumber).toContain('512')
    expect(useUserProfileStore.getState().notificationPhoneVerified).toBe(true)
    expect(useUserProfileStore.getState().isAuthenticated).toBe(true)
    expect(useUserProfileStore.getState().authMethod).toBe('phone')
    expect(navigation.navigate).toHaveBeenCalledWith('MainTabs')
  })

  it('blocks sign up when password does not meet security requirements', () => {
    const { getByTestId } = render(<AuthEntryScreen navigation={navigation} />)

    fireEvent.press(getByTestId('auth-mode-signup'))
    fireEvent.press(getByTestId('auth-contact-email'))
    fireEvent.changeText(getByTestId('auth-first-name-input'), 'Tyriq')
    fireEvent.changeText(getByTestId('auth-last-name-input'), 'Stark')
    fireEvent.changeText(getByTestId('auth-email-input'), 'tyriq@example.com')
    fireEvent.press(getByTestId('auth-send-verification-code'))
    fireEvent.changeText(getByTestId('auth-verification-code-input'), '482913')
    fireEvent.press(getByTestId('auth-verify-code-button'))
    fireEvent.changeText(getByTestId('auth-password-input'), 'weakpass12')
    fireEvent.changeText(getByTestId('auth-confirm-password-input'), 'weakpass12')
    fireEvent.press(getByTestId('auth-submit-button'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Weak password',
      expect.stringContaining('12 characters')
    )
    expect(navigation.navigate).not.toHaveBeenCalledWith('OnboardingGoals')
  })

  it('blocks sign up with invalid email', () => {
    const { getByTestId } = render(<AuthEntryScreen navigation={navigation} />)

    fireEvent.press(getByTestId('auth-mode-signup'))
    fireEvent.press(getByTestId('auth-contact-email'))
    fireEvent.changeText(getByTestId('auth-first-name-input'), 'Tyriq')
    fireEvent.changeText(getByTestId('auth-last-name-input'), 'Stark')
    fireEvent.changeText(getByTestId('auth-email-input'), 'tyriq@@example..com')
    fireEvent.press(getByTestId('auth-send-verification-code'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid email',
      expect.stringContaining('valid email')
    )
  })

  it('navigates to forgot password and forgot email screens from auth entry', () => {
    const { getByTestId } = render(<AuthEntryScreen navigation={navigation} />)

    fireEvent.press(getByTestId('auth-forgot-password'))
    fireEvent.press(getByTestId('auth-forgot-email'))

    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword')
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotEmail')
  })

  it('submits forgot password and shows confirmation', () => {
    const { getByTestId } = render(<ForgotPasswordScreen navigation={navigation} />)

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'tyriq@example.com')
    fireEvent.press(getByTestId('forgot-password-submit'))

    expect(useUserProfileStore.getState().pendingPasswordResetEmail).toBe('tyriq@example.com')
    expect(Alert.alert).toHaveBeenCalledWith(
      'Reset link sent',
      expect.stringContaining('tyriq@example.com'),
      expect.any(Array)
    )
  })

  it('resets password using verification link and updates profile state', () => {
    const { getByTestId } = render(<ForgotPasswordScreen navigation={navigation} />)

    fireEvent.changeText(getByTestId('forgot-password-link-input'), 'https://careerlift.ai/reset?token=abc123')
    fireEvent.changeText(getByTestId('forgot-password-new-password-input'), 'StrongPass123!')
    fireEvent.changeText(getByTestId('forgot-password-confirm-password-input'), 'StrongPass123!')
    fireEvent.press(getByTestId('forgot-password-verify-link-submit'))

    expect(useUserProfileStore.getState().passwordResetVerifiedAt).toBeTruthy()
    expect(useUserProfileStore.getState().pendingPasswordResetEmail).toBeNull()
    expect(Alert.alert).toHaveBeenCalledWith(
      'Password updated',
      expect.stringContaining('reset successfully'),
      expect.any(Array)
    )
  })

  it('verifies forgot email code and reveals account email', () => {
    useUserProfileStore.getState().setProfile({
      email: 'secure.user@example.com',
      notificationPhoneNumber: '+1 (512) 555-0199',
      notificationPhoneVerified: true,
    })

    const { getByTestId } = render(<ForgotEmailScreen navigation={navigation} />)

    fireEvent.changeText(getByTestId('forgot-email-phone-input'), '+1 (512) 555-0199')
    fireEvent.press(getByTestId('forgot-email-send-code'))
    fireEvent.changeText(getByTestId('forgot-email-code-input'), '482913')
    fireEvent.press(getByTestId('forgot-email-verify-code'))

    expect(getByTestId('forgot-email-recovered-email').props.children).toBe('secure.user@example.com')
  })

  it('blocks sign in with invalid phone number', () => {
    const { getByTestId } = render(<AuthEntryScreen navigation={navigation} />)

    fireEvent.press(getByTestId('auth-mode-signin'))
    fireEvent.press(getByTestId('auth-contact-phone'))
    fireEvent.changeText(getByTestId('auth-phone-input'), '111-111-1111')
    fireEvent.changeText(getByTestId('auth-password-input'), 'SecurePass123')
    fireEvent.press(getByTestId('auth-submit-button'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid phone',
      expect.stringContaining('valid US phone number')
    )
    expect(navigation.navigate).not.toHaveBeenCalledWith('MainTabs')
  })
})
