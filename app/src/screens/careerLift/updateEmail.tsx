import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEMO_VERIFICATION_CODE = '246810'

type Step = 'email' | 'verify'

function maskEmail(email: string) {
  const [localPart, domain = ''] = email.split('@')
  if (!localPart) return email
  if (localPart.length <= 2) return `${localPart[0] ?? '*'}*@${domain}`
  return `${localPart[0]}${'*'.repeat(Math.min(5, localPart.length - 2))}${localPart.at(-1)}@${domain}`
}

export function UpdateEmailScreen() {
  const navigation = useNavigation<any>()
  const { email, setProfile } = useUserProfileStore()
  const [step, setStep] = useState<Step>('email')
  const [newEmail, setNewEmail] = useState(email)
  const [pendingEmail, setPendingEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [didAttemptEmailSubmit, setDidAttemptEmailSubmit] = useState(false)
  const [didAttemptVerifySubmit, setDidAttemptVerifySubmit] = useState(false)

  useEffect(() => {
    if (resendCountdown <= 0) return
    const interval = setInterval(() => {
      setResendCountdown(value => (value <= 1 ? 0 : value - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCountdown])

  const trimmedNewEmail = newEmail.trim().toLowerCase()
  const currentEmailNormalized = email.trim().toLowerCase()
  const isEmailValid = EMAIL_REGEX.test(trimmedNewEmail)
  const isDifferentEmail = trimmedNewEmail.length > 0 && trimmedNewEmail !== currentEmailNormalized
  const canSendCode = isEmailValid && isDifferentEmail

  const emailError = useMemo(() => {
    if (!didAttemptEmailSubmit) return ''
    if (!trimmedNewEmail) return 'Enter your new email address.'
    if (!isEmailValid) return 'Enter a valid email address.'
    if (!isDifferentEmail) return 'New email must be different from your current email.'
    return ''
  }, [didAttemptEmailSubmit, trimmedNewEmail, isEmailValid, isDifferentEmail])

  const codeIsSixDigits = /^\d{6}$/.test(verificationCode.trim())
  const codeMatches = verificationCode.trim() === sentCode
  const verifyError = useMemo(() => {
    if (!didAttemptVerifySubmit) return ''
    if (!codeIsSixDigits) return 'Verification code must be 6 digits.'
    if (!codeMatches) return 'Invalid verification code. Please try again.'
    return ''
  }, [didAttemptVerifySubmit, codeIsSixDigits, codeMatches])

  const handleSendCode = () => {
    setDidAttemptEmailSubmit(true)
    if (!canSendCode) return

    setPendingEmail(trimmedNewEmail)
    setSentCode(DEMO_VERIFICATION_CODE)
    setVerificationCode('')
    setDidAttemptVerifySubmit(false)
    setResendCountdown(30)
    setStep('verify')

    Alert.alert('Verification Code Sent', `A 6-digit code was sent to ${trimmedNewEmail}.`)
  }

  const handleResendCode = () => {
    if (resendCountdown > 0 || !pendingEmail) return
    setSentCode(DEMO_VERIFICATION_CODE)
    setVerificationCode('')
    setDidAttemptVerifySubmit(false)
    setResendCountdown(30)
    Alert.alert('Code Resent', `We sent a new code to ${pendingEmail}.`)
  }

  const handleVerifyCode = () => {
    setDidAttemptVerifySubmit(true)
    if (!codeIsSixDigits || !codeMatches) return

    setProfile({ email: pendingEmail })
    Alert.alert('Email Updated', 'Your account email has been updated successfully.', [
      { text: 'Done', onPress: () => navigation.goBack() },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='arrow-back-ios-new' size={20} color={CLTheme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Email</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>
            {step === 'email' ? 'Change your account email' : 'Verify your new email'}
          </Text>
          <Text style={styles.introText}>
            {step === 'email'
              ? 'Enter a new email address. We will send a 6-digit verification code to confirm ownership.'
              : `Enter the code sent to ${maskEmail(pendingEmail)} to complete your email update.`}
          </Text>
        </View>

        <View style={styles.currentEmailCard}>
          <Text style={styles.currentEmailLabel}>Current email</Text>
          <Text style={styles.currentEmailValue}>{email}</Text>
        </View>

        {step === 'email' ? (
          <View style={styles.formSection}>
            <Text style={styles.label}>New Email Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder='name@company.com'
                placeholderTextColor={CLTheme.text.muted}
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize='none'
                keyboardType='email-address'
                testID='new-email-input'
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>
        ) : (
          <View style={styles.formSection}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder='6-digit code'
                placeholderTextColor={CLTheme.text.muted}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType='number-pad'
                maxLength={6}
                testID='verification-code-input'
              />
            </View>
            {verifyError ? <Text style={styles.errorText}>{verifyError}</Text> : null}

            <TouchableOpacity
              style={[styles.resendLink, resendCountdown > 0 && styles.resendLinkDisabled]}
              onPress={handleResendCode}
              disabled={resendCountdown > 0}
              testID='resend-code-button'
            >
              <Text style={styles.resendLinkText}>
                {resendCountdown > 0
                  ? `Resend code in ${resendCountdown}s`
                  : 'Didn’t get the code? Resend'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step === 'email' ? (
          <TouchableOpacity
            style={[styles.primaryButton, !canSendCode && styles.primaryButtonDisabled]}
            onPress={handleSendCode}
            testID='send-code-button'
          >
            <Text style={styles.primaryButtonText}>Send Verification Code</Text>
            <MaterialIcons name='mail-outline' size={19} color='#fff' />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, (!codeIsSixDigits || !codeMatches) && styles.primaryButtonDisabled]}
            onPress={handleVerifyCode}
            testID='verify-email-button'
          >
            <Text style={styles.primaryButtonText}>Verify & Update Email</Text>
            <MaterialIcons name='verified' size={19} color='#fff' />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 140,
  },
  introBlock: {
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: CLTheme.text.primary,
    marginBottom: 8,
  },
  introText: {
    fontSize: 13,
    lineHeight: 19,
    color: CLTheme.text.secondary,
  },
  currentEmailCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  currentEmailLabel: {
    fontSize: 12,
    color: CLTheme.text.muted,
    marginBottom: 3,
  },
  currentEmailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  formSection: {
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: CLTheme.text.primary,
    fontSize: 14,
  },
  resendLink: {
    marginTop: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  resendLinkText: {
    color: CLTheme.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    color: CLTheme.status.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    backgroundColor: CLTheme.background,
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
