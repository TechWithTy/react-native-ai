import React, { useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useUserProfileStore } from '../../store/userProfileStore'
import { CLThemeTokens, useCLTheme } from './theme'
import { isValidEmailAddress, isValidUSPhoneNumber, toE164USPhone } from '../../utils/validation'

type AuthMode = 'signin' | 'signup'
type ContactMode = 'email' | 'phone'

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/
const MOCK_VERIFICATION_CODE = '482913'

const getPasswordRequirements = (value: string) => ({
  minLength: value.length >= 12,
  hasUppercase: /[A-Z]/.test(value),
  hasLowercase: /[a-z]/.test(value),
  hasNumber: /\d/.test(value),
  hasSpecialChar: SPECIAL_CHAR_REGEX.test(value),
})

export function AuthEntryScreen({ navigation }: any) {
  const clTheme = useCLTheme()
  const styles = getStyles(clTheme)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [contactMode, setContactMode] = useState<ContactMode>('email')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [isContactVerified, setIsContactVerified] = useState(false)
  const [verifiedContactValue, setVerifiedContactValue] = useState<string | null>(null)
  const setProfile = useUserProfileStore(state => state.setProfile)
  const markAuthenticated = useUserProfileStore(state => state.markAuthenticated)
  const addActivityLogEntry = useUserProfileStore(state => state.addActivityLogEntry)
  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password])

  const title = useMemo(
    () => (authMode === 'signup' ? 'Create your account' : 'Welcome back'),
    [authMode]
  )
  const subtitle = useMemo(
    () =>
      authMode === 'signup'
        ? 'Sign up with email or phone to continue.'
        : 'Sign in with your existing credentials.',
    [authMode]
  )

  const normalizedContactValue = useMemo(() => {
    if (contactMode === 'email') {
      return email.trim().toLowerCase()
    }
    return toE164USPhone(phoneNumber) || ''
  }, [contactMode, email, phoneNumber])

  const resetVerificationState = () => {
    setVerificationCode('')
    setCodeSent(false)
    setIsContactVerified(false)
    setVerifiedContactValue(null)
  }

  const validate = () => {
    if (authMode === 'signup' && firstName.trim().length < 2) {
      Alert.alert('Missing first name', 'Enter your first name to continue.')
      return false
    }

    if (authMode === 'signup' && lastName.trim().length < 2) {
      Alert.alert('Missing last name', 'Enter your last name to continue.')
      return false
    }

    if (contactMode === 'email') {
      if (!isValidEmailAddress(email)) {
        Alert.alert('Invalid email', 'Enter a valid email address.')
        return false
      }
    } else if (!isValidUSPhoneNumber(phoneNumber)) {
      Alert.alert('Invalid phone', 'Enter a valid US phone number.')
      return false
    }

    if (authMode === 'signup') {
      const unmetRequirements = Object.values(passwordRequirements).some(value => !value)
      if (unmetRequirements) {
        Alert.alert(
          'Weak password',
          'Use at least 12 characters with uppercase, lowercase, number, and special character.'
        )
        return false
      }
    } else if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return false
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Confirm password must match.')
      return false
    }

    if (authMode === 'signup') {
      if (!isContactVerified || !verifiedContactValue || verifiedContactValue !== normalizedContactValue) {
        Alert.alert(
          'Verify contact info',
          'Send and verify the code for your selected email or phone before registering.'
        )
        return false
      }
    }

    return true
  }

  const handleSendVerificationCode = () => {
    if (contactMode === 'email') {
      if (!isValidEmailAddress(email)) {
        Alert.alert('Invalid email', 'Enter a valid email address before sending code.')
        return
      }
    } else if (!isValidUSPhoneNumber(phoneNumber)) {
      Alert.alert('Invalid phone', 'Enter a valid US phone number before sending code.')
      return
    }

    setCodeSent(true)
    setIsContactVerified(false)
    setVerifiedContactValue(null)
    Alert.alert(
      'Verification code sent',
      `Enter code ${MOCK_VERIFICATION_CODE} to verify your ${contactMode}.`
    )
  }

  const handleVerifyCode = () => {
    if (!codeSent) {
      Alert.alert('Send code first', 'Request a verification code before trying to verify.')
      return
    }
    if (verificationCode.trim() !== MOCK_VERIFICATION_CODE) {
      Alert.alert('Invalid code', 'The verification code is incorrect.')
      return
    }
    setIsContactVerified(true)
    setVerifiedContactValue(normalizedContactValue)
    Alert.alert('Verified', `Your ${contactMode} is verified.`)
  }

  const handleSubmit = () => {
    if (!validate()) return

    const contactLabel = contactMode === 'email' ? 'email' : 'phone'
    const authEventLabel = authMode === 'signup' ? 'Account created' : 'Sign in completed'

    if (contactMode === 'email') {
      setProfile({ email: email.trim() })
    } else {
      const normalizedPhone = toE164USPhone(phoneNumber)
      if (!normalizedPhone) {
        Alert.alert('Invalid phone', 'Enter a valid US phone number.')
        return
      }
      setProfile({ notificationPhoneNumber: normalizedPhone, notificationPhoneVerified: true })
    }
    if (authMode === 'signup') {
      const combinedName = `${firstName.trim()} ${lastName.trim()}`.trim()
      if (combinedName.length > 1) {
        setProfile({ name: combinedName, firstName: firstName.trim(), lastName: lastName.trim() })
      }
    }
    markAuthenticated(contactMode)
    addActivityLogEntry({
      eventType: 'security_update',
      source: 'settings',
      title: authEventLabel,
      description: `${authMode === 'signup' ? 'Registered' : 'Signed in'} with ${contactLabel}.`,
    })

    if (authMode === 'signup') {
      navigation.navigate('OnboardingGoals')
      return
    }

    navigation.navigate('MainTabs')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name='arrow-back' size={20} color={clTheme.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeChip, authMode === 'signup' && styles.modeChipActive]}
            onPress={() => setAuthMode('signup')}
            testID='auth-mode-signup'
          >
            <Text style={[styles.modeChipText, authMode === 'signup' && styles.modeChipTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, authMode === 'signin' && styles.modeChipActive]}
            onPress={() => setAuthMode('signin')}
            testID='auth-mode-signin'
          >
            <Text style={[styles.modeChipText, authMode === 'signin' && styles.modeChipTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeChip, contactMode === 'email' && styles.modeChipActive]}
            onPress={() => {
              setContactMode('email')
              resetVerificationState()
            }}
            testID='auth-contact-email'
          >
            <Text style={[styles.modeChipText, contactMode === 'email' && styles.modeChipTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, contactMode === 'phone' && styles.modeChipActive]}
            onPress={() => {
              setContactMode('phone')
              resetVerificationState()
            }}
            testID='auth-contact-phone'
          >
            <Text style={[styles.modeChipText, contactMode === 'phone' && styles.modeChipTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'signup' ? (
          <View style={styles.splitInputRow}>
            <TextInput
              style={[styles.input, styles.splitInput]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder='First name'
              placeholderTextColor={clTheme.text.muted}
              testID='auth-first-name-input'
            />
            <TextInput
              style={[styles.input, styles.splitInput]}
              value={lastName}
              onChangeText={setLastName}
              placeholder='Last name'
              placeholderTextColor={clTheme.text.muted}
              testID='auth-last-name-input'
            />
          </View>
        ) : null}

        {contactMode === 'email' ? (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(value) => {
              setEmail(value)
              if (verifiedContactValue && value.trim().toLowerCase() !== verifiedContactValue) {
                setIsContactVerified(false)
              }
            }}
            placeholder='Email address'
            placeholderTextColor={clTheme.text.muted}
            autoCapitalize='none'
            keyboardType='email-address'
            testID='auth-email-input'
          />
        ) : (
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={(value) => {
              setPhoneNumber(value)
              const normalized = toE164USPhone(value) || ''
              if (verifiedContactValue && normalized !== verifiedContactValue) {
                setIsContactVerified(false)
              }
            }}
            placeholder='Phone number'
            placeholderTextColor={clTheme.text.muted}
            keyboardType='phone-pad'
            testID='auth-phone-input'
          />
        )}

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder='Password'
          placeholderTextColor={clTheme.text.muted}
          secureTextEntry
          testID='auth-password-input'
        />

        {authMode === 'signup' ? (
          <View style={styles.verificationCard} testID='auth-contact-verification-card'>
            <Text style={styles.verificationTitle}>Contact Verification</Text>
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={handleSendVerificationCode}
              testID='auth-send-verification-code'
            >
              <Text style={styles.secondaryActionText}>Send Verification Code</Text>
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
                  testID='auth-verification-code-input'
                />
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={handleVerifyCode}
                  testID='auth-verify-code-button'
                >
                  <Text style={styles.secondaryActionText}>Verify Code</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <Text style={styles.verificationStatusText}>
              {isContactVerified ? `Verified ${contactMode}` : `Not verified yet`}
            </Text>
          </View>
        ) : null}

        {authMode === 'signup' ? (
          <View style={styles.requirementsCard} testID='auth-password-requirements'>
            <Text style={styles.requirementsTitle}>Password Requirements</Text>
            {[
              ['At least 12 characters', passwordRequirements.minLength],
              ['At least 1 uppercase letter', passwordRequirements.hasUppercase],
              ['At least 1 lowercase letter', passwordRequirements.hasLowercase],
              ['At least 1 number', passwordRequirements.hasNumber],
              ['At least 1 special character', passwordRequirements.hasSpecialChar],
            ].map(([label, met]) => (
              <View key={String(label)} style={styles.requirementRow}>
                <MaterialIcons
                  name={met ? 'check-circle' : 'radio-button-unchecked'}
                  size={16}
                  color={met ? '#10b981' : clTheme.text.muted}
                />
                <Text style={[styles.requirementText, met ? styles.requirementTextMet : null]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {authMode === 'signup' ? (
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder='Confirm password'
            placeholderTextColor={clTheme.text.muted}
            secureTextEntry
            testID='auth-confirm-password-input'
          />
        ) : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} testID='auth-submit-button'>
          <Text style={styles.submitText}>{authMode === 'signup' ? 'Register' : 'Sign In'}</Text>
        </TouchableOpacity>

          <View style={styles.linksRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              testID='auth-forgot-password'
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotEmail')} testID='auth-forgot-email'>
              <Text style={styles.linkText}>Forgot Email?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: clTheme.text.primary,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: clTheme.text.primary,
    },
    subtitle: {
      fontSize: 13,
      color: clTheme.text.secondary,
      marginBottom: 6,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    modeChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: clTheme.border,
      backgroundColor: clTheme.card,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    modeChipActive: {
      borderColor: clTheme.accent,
      backgroundColor: 'rgba(13, 108, 242, 0.15)',
    },
    modeChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: clTheme.text.secondary,
    },
    modeChipTextActive: {
      color: clTheme.accent,
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
    splitInputRow: {
      flexDirection: 'row',
      gap: 10,
    },
    splitInput: {
      flex: 1,
    },
    requirementsCard: {
      borderWidth: 1,
      borderColor: clTheme.border,
      borderRadius: 10,
      backgroundColor: clTheme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    verificationCard: {
      borderWidth: 1,
      borderColor: clTheme.border,
      borderRadius: 10,
      backgroundColor: clTheme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    verificationTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: clTheme.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    verificationStatusText: {
      fontSize: 12,
      color: clTheme.text.muted,
      fontWeight: '600',
    },
    secondaryActionButton: {
      borderWidth: 1,
      borderColor: clTheme.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: clTheme.background,
    },
    secondaryActionText: {
      color: clTheme.accent,
      fontWeight: '700',
      fontSize: 13,
    },
    requirementsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: clTheme.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requirementText: {
      fontSize: 12,
      color: clTheme.text.muted,
      fontWeight: '500',
    },
    requirementTextMet: {
      color: clTheme.text.primary,
    },
    submitButton: {
      marginTop: 8,
      borderRadius: 10,
      backgroundColor: clTheme.accent,
      paddingVertical: 13,
      alignItems: 'center',
    },
    submitText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    linksRow: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    linkText: {
      color: clTheme.accent,
      fontSize: 13,
      fontWeight: '600',
    },
  })
