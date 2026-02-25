import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { CLThemeTokens, useCLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'
import { isValidUSPhoneNumber, toE164USPhone } from '../../utils/validation'

const MOCK_VERIFICATION_CODE = '482913'

const maskEmail = (value: string) => {
  const [local, domain] = value.split('@')
  if (!local || !domain) return value
  const safeLocal =
    local.length <= 2 ? `${local[0] ?? '*'}*` : `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 1))}`
  return `${safeLocal}@${domain}`
}

export function ForgotEmailScreen({ navigation }: any) {
  const clTheme = useCLTheme()
  const styles = getStyles(clTheme)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null)
  const storedPhone = useUserProfileStore(state => state.notificationPhoneNumber)
  const isStoredPhoneVerified = useUserProfileStore(state => state.notificationPhoneVerified)
  const storedEmail = useUserProfileStore(state => state.email)
  const addActivityLogEntry = useUserProfileStore(state => state.addActivityLogEntry)

  const handleSendCode = () => {
    const providedPhone = toE164USPhone(phoneNumber)
    const expectedPhone = toE164USPhone(storedPhone)

    if (!isValidUSPhoneNumber(phoneNumber) || !providedPhone) {
      Alert.alert('Invalid phone', 'Enter a valid phone number to recover your email.')
      return
    }

    if (!isStoredPhoneVerified) {
      Alert.alert('Phone not verified', 'Verify your phone in Account & Security before recovery.')
      return
    }

    if (expectedPhone && providedPhone !== expectedPhone) {
      Alert.alert('Phone mismatch', 'This phone number does not match your verified account phone.')
      return
    }

    setCodeSent(true)
    Alert.alert('Verification code sent', 'Enter the 6-digit code sent to your verified phone number.')
  }

  const handleVerifyCode = () => {
    if (!codeSent) {
      Alert.alert('Send code first', 'Request a verification code before continuing.')
      return
    }

    if (verificationCode.trim() !== MOCK_VERIFICATION_CODE) {
      Alert.alert('Invalid code', 'The verification code is incorrect. Please try again.')
      return
    }

    setIsVerified(true)
    setRevealedEmail(storedEmail)
    addActivityLogEntry({
      eventType: 'security_update',
      source: 'account_security',
      title: 'Email recovery completed',
      description: 'Email was revealed after phone verification.',
    })

    Alert.alert(
      'Verified',
      'Verification successful. Your account email is now shown below.'
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name='arrow-back' size={20} color={clTheme.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Email</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Enter your verified phone number and we will send the email tied to your account.
          </Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder='+1 (555) 123-4567'
            placeholderTextColor={clTheme.text.muted}
            keyboardType='phone-pad'
            testID='forgot-email-phone-input'
          />
          <TouchableOpacity style={styles.button} onPress={handleSendCode} testID='forgot-email-send-code'>
            <Text style={styles.buttonText}>Send Verification Code</Text>
          </TouchableOpacity>

          {codeSent ? (
            <>
              <TextInput
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder='6-digit verification code'
                placeholderTextColor={clTheme.text.muted}
                keyboardType='number-pad'
                testID='forgot-email-code-input'
              />
              <TouchableOpacity style={styles.button} onPress={handleVerifyCode} testID='forgot-email-verify-code'>
                <Text style={styles.buttonText}>Verify Code</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {isVerified && revealedEmail ? (
            <View style={styles.resultCard} testID='forgot-email-recovery-result'>
              <Text style={styles.resultLabel}>Recovered Email</Text>
              <Text style={styles.resultMasked}>{maskEmail(revealedEmail)}</Text>
              <Text style={styles.resultFull} testID='forgot-email-recovered-email'>{revealedEmail}</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                testID='forgot-email-back-to-signin'
              >
                <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}

const getStyles = (clTheme: CLThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: clTheme.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: clTheme.text.primary,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      gap: 12,
    },
    description: {
      fontSize: 13,
      color: clTheme.text.secondary,
      lineHeight: 19,
    },
    input: {
      borderWidth: 1,
      borderColor: clTheme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: clTheme.text.primary,
      backgroundColor: clTheme.card,
      fontSize: 14,
    },
    button: {
      marginTop: 8,
      borderRadius: 10,
      backgroundColor: clTheme.accent,
      paddingVertical: 13,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    resultCard: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: clTheme.border,
      borderRadius: 10,
      backgroundColor: clTheme.card,
      padding: 12,
      gap: 6,
    },
    resultLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: clTheme.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    resultMasked: {
      fontSize: 13,
      color: clTheme.text.secondary,
    },
    resultFull: {
      fontSize: 16,
      fontWeight: '700',
      color: clTheme.text.primary,
    },
    secondaryButton: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: clTheme.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: clTheme.accent,
      fontWeight: '700',
      fontSize: 13,
    },
  })
