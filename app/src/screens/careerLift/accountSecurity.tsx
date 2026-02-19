import React, { useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { checkFaceIdAvailability, promptFaceIdAuthentication } from '../../native/permissions/biometrics'

const DEMO_AUTH_APP_CODE = '135790'
const DEMO_AUTH_APP_KEY = 'CLFT-2FA-AUTH-7K9P'
const DEMO_PHONE_VERIFICATION_CODE = '482913'

function maskPhone(phone: string | null) {
  if (!phone) return null
  const normalized = phone.replace(/\D/g, '')
  if (normalized.length < 4) return phone
  return `***-***-${normalized.slice(-4)}`
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function formatPhone(phone: string) {
  const normalized = normalizePhone(phone)
  if (normalized.length === 11 && normalized.startsWith('1')) {
    const n = normalized.slice(1)
    return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6, 10)}`
  }
  if (normalized.length === 10) {
    return `+1 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 10)}`
  }
  return phone
}

export function AccountSecurityScreen() {
  const navigation = useNavigation<any>()
  const {
    email,
    twoFactorAuth,
    faceIdAuthEnabled,
    notificationPhoneNumber,
    notificationPhoneVerified,
    setProfile,
  } = useUserProfileStore()
  const [isFaceIdProcessing, setIsFaceIdProcessing] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [selectedTwoFactorMethod, setSelectedTwoFactorMethod] = useState<'sms' | 'authenticator' | null>(null)
  const [authAppCode, setAuthAppCode] = useState('')
  const [setupError, setSetupError] = useState('')
  const [setupInfo, setSetupInfo] = useState('')
  const [showPhoneSetup, setShowPhoneSetup] = useState(false)
  const [phoneInput, setPhoneInput] = useState(notificationPhoneNumber)
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [pendingPhone, setPendingPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneInfo, setPhoneInfo] = useState('')

  const resetTwoFactorSetup = () => {
    setSelectedTwoFactorMethod(null)
    setAuthAppCode('')
    setSetupError('')
    setSetupInfo('')
  }

  const closeTwoFactorSetup = () => {
    setShowTwoFactorSetup(false)
    resetTwoFactorSetup()
  }

  const openPhoneSetup = () => {
    setPhoneInput(notificationPhoneNumber)
    setPhoneCode('')
    setPhoneCodeSent(false)
    setPendingPhone('')
    setPhoneError('')
    setPhoneInfo('')
    setShowPhoneSetup(true)
  }

  const closePhoneSetup = () => {
    setShowPhoneSetup(false)
    setPhoneCode('')
    setPhoneCodeSent(false)
    setPendingPhone('')
    setPhoneError('')
    setPhoneInfo('')
  }

  const handleToggleTwoFactor = (nextValue: boolean) => {
    if (nextValue) {
      if (twoFactorAuth.enabled) return
      setShowTwoFactorSetup(true)
      return
    }

    if (!twoFactorAuth.enabled) return

    Alert.alert('Disable 2FA?', 'This will remove additional sign-in protection for your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: () =>
          setProfile({
            twoFactorAuth: {
              enabled: false,
              method: null,
              phoneNumber: null,
            },
          }),
      },
    ])
  }

  const normalizedVerifiedPhone = normalizePhone(notificationPhoneNumber)
  const hasVerifiedPhone = notificationPhoneVerified && normalizedVerifiedPhone.length >= 10
  const formattedPhone = formatPhone(notificationPhoneNumber)
  const normalizedPhoneInput = normalizePhone(phoneInput)
  const hasValidPhoneInput = normalizedPhoneInput.length >= 10
  const hasValidPhoneCode = /^\d{6}$/.test(phoneCode.trim())
  const hasValidAuthCode = /^\d{6}$/.test(authAppCode.trim())

  const twoFactorSubtitle = twoFactorAuth.enabled
    ? twoFactorAuth.method === 'sms'
      ? `Enabled via SMS ${maskPhone(twoFactorAuth.phoneNumber) ?? ''}`.trim()
      : 'Enabled via authenticator app'
    : 'Recommended for safety'

  const isEnableActionAllowed =
    selectedTwoFactorMethod === 'sms'
      ? hasVerifiedPhone
      : selectedTwoFactorMethod === 'authenticator'
        ? hasValidAuthCode
        : false

  const handleSendPhoneCode = () => {
    if (!hasValidPhoneInput) {
      setPhoneError('Enter a valid phone number before requesting the code.')
      setPhoneInfo('')
      return
    }
    setPendingPhone(normalizedPhoneInput)
    setPhoneCodeSent(true)
    setPhoneError('')
    setPhoneInfo(`Verification code sent to ${maskPhone(normalizedPhoneInput)}.`)
  }

  const handleVerifyPhone = () => {
    if (!hasValidPhoneInput) {
      setPhoneError('Enter a valid phone number.')
      return
    }
    if (!phoneCodeSent) {
      setPhoneError('Send a verification code first.')
      return
    }
    if (!hasValidPhoneCode || phoneCode.trim() !== DEMO_PHONE_VERIFICATION_CODE) {
      setPhoneError('Invalid verification code. Please try again.')
      return
    }

    const formatted = formatPhone(pendingPhone || normalizedPhoneInput)
    const shouldUpdateTwoFactorPhone = twoFactorAuth.enabled && twoFactorAuth.method === 'sms'

    setProfile({
      notificationPhoneNumber: formatted,
      notificationPhoneVerified: true,
      twoFactorAuth: shouldUpdateTwoFactorPhone
        ? {
            enabled: true,
            method: 'sms',
            phoneNumber: pendingPhone || normalizedPhoneInput,
          }
        : twoFactorAuth,
    })

    Alert.alert('Phone Verified', 'Your phone number is now verified and ready for SMS security.')
    closePhoneSetup()
  }

  const handleEnableTwoFactor = () => {
    setSetupError('')

    if (selectedTwoFactorMethod === 'sms') {
      if (!hasVerifiedPhone) {
        setSetupError('Verify a phone number in Login & Security before enabling SMS 2FA.')
        return
      }

      setProfile({
        twoFactorAuth: {
          enabled: true,
          method: 'sms',
          phoneNumber: normalizedVerifiedPhone,
        },
      })
      closeTwoFactorSetup()
      Alert.alert('Two-Factor Enabled', `SMS verification is now required for ${maskPhone(normalizedVerifiedPhone)}.`)
      return
    }

    if (selectedTwoFactorMethod === 'authenticator') {
      if (authAppCode.trim() !== DEMO_AUTH_APP_CODE) {
        setSetupError('Invalid authenticator app code. Please try again.')
        return
      }

      setProfile({
        twoFactorAuth: {
          enabled: true,
          method: 'authenticator',
          phoneNumber: null,
        },
      })
      closeTwoFactorSetup()
      Alert.alert('Two-Factor Enabled', 'Authenticator app verification is now required for sign-in.')
      return
    }

    setSetupError('Select a verification method to continue.')
  }

  const handleToggleFaceId = async (nextValue: boolean) => {
    if (isFaceIdProcessing) return

    if (!nextValue) {
      if (!faceIdAuthEnabled) return
      Alert.alert('Disable Face ID?', 'You can re-enable Face ID anytime from Account & Security.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: () => setProfile({ faceIdAuthEnabled: false }) },
      ])
      return
    }

    setIsFaceIdProcessing(true)
    try {
      const availability = await checkFaceIdAvailability()
      if (!availability.available) {
        const title = availability.reason?.includes('Set up Face ID') ? 'No biometrics enrolled' : 'Face ID unavailable'
        Alert.alert(title, availability.reason || 'Face ID could not be enabled on this device.')
        return
      }

      const didAuthenticate = await promptFaceIdAuthentication()
      if (!didAuthenticate) {
        Alert.alert('Verification failed', 'Face ID verification was not completed.')
        return
      }

      setProfile({ faceIdAuthEnabled: true })
      Alert.alert('Face ID Enabled', 'Biometric verification is now enabled for account security.')
    } catch {
      Alert.alert('Face ID error', 'Something went wrong while enabling Face ID.')
    } finally {
      setIsFaceIdProcessing(false)
    }
  }

  const faceIdSubtitle = isFaceIdProcessing
    ? 'Checking Face ID permissions...'
    : faceIdAuthEnabled
      ? 'Enabled for secure sign-in'
      : 'Use Face ID for faster secure sign-in'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='chevron-left' size={28} color={CLTheme.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOGIN & SECURITY</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('UpdateEmail')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.blueBg]}>
                  <MaterialIcons name='mail-outline' size={18} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Email</Text>
              </View>
              <View style={styles.emailRight}>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {email}
                </Text>
                <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.muted} />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={openPhoneSetup}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.blueBg]}>
                  <MaterialIcons name='smartphone' size={18} color={CLTheme.accent} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Phone Number</Text>
                  <Text style={styles.rowHint}>
                    {notificationPhoneVerified
                      ? `Verified ${maskPhone(notificationPhoneNumber) ?? ''}`.trim()
                      : 'Not verified'}
                  </Text>
                </View>
              </View>
              <View style={styles.phoneRight}>
                <View
                  style={[
                    styles.phoneBadge,
                    notificationPhoneVerified ? styles.phoneBadgeVerified : styles.phoneBadgeUnverified,
                  ]}
                >
                  <Text
                    style={[
                      styles.phoneBadgeText,
                      notificationPhoneVerified
                        ? styles.phoneBadgeTextVerified
                        : styles.phoneBadgeTextUnverified,
                    ]}
                  >
                    {notificationPhoneVerified ? 'Verified' : 'Verify'}
                  </Text>
                </View>
                <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.muted} />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('UpdatePassword')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.blueBg]}>
                  <MaterialIcons name='lock-reset' size={18} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Change Password</Text>
              </View>
              <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.muted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.blueBg]}>
                  <MaterialIcons name='security' size={18} color={CLTheme.accent} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
                  <Text style={styles.rowHint}>{twoFactorSubtitle}</Text>
                </View>
              </View>
              <Switch
                value={twoFactorAuth.enabled}
                onValueChange={handleToggleTwoFactor}
                thumbColor='#fff'
                trackColor={{ false: '#354053', true: CLTheme.accent }}
                testID='twofa-toggle'
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEVICE MANAGEMENT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.greenBg]}>
                  <MaterialIcons name='face' size={18} color={CLTheme.status.success} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Face ID</Text>
                  <Text style={styles.rowHint}>{faceIdSubtitle}</Text>
                </View>
              </View>
              <Switch
                value={faceIdAuthEnabled}
                onValueChange={handleToggleFaceId}
                disabled={isFaceIdProcessing}
                thumbColor='#fff'
                trackColor={{ false: '#354053', true: CLTheme.status.success }}
                testID='faceid-toggle'
              />
            </View>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                Alert.alert('Active Sessions', 'Current device: iPhone 14 Pro • Austin, TX')
              }
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.orangeBg]}>
                  <MaterialIcons name='devices' size={18} color={CLTheme.status.warning} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Active Sessions</Text>
                  <Text style={styles.rowHint}>Current device session</Text>
                </View>
              </View>
              <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & COMPLIANCE</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => Alert.alert('Data Export', 'Your export request has been queued.')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.indigoBg]}>
                  <MaterialIcons name='download' size={18} color='#a5b4fc' />
                </View>
                <Text style={styles.rowLabel}>Request Data Export</Text>
              </View>
              <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.muted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Alert.alert('Privacy Policy', 'Opening privacy policy...')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.grayBg]}>
                  <MaterialIcons name='policy' size={18} color={CLTheme.text.secondary} />
                </View>
                <Text style={styles.rowLabel}>Privacy Policy</Text>
              </View>
              <MaterialIcons name='open-in-new' size={18} color={CLTheme.text.muted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Alert.alert('Terms of Service', 'Opening terms of service...')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.grayBg]}>
                  <MaterialIcons name='description' size={18} color={CLTheme.text.secondary} />
                </View>
                <Text style={styles.rowLabel}>Terms of Service</Text>
              </View>
              <MaterialIcons name='open-in-new' size={18} color={CLTheme.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              'Delete Account',
              'This would permanently remove your account. This action cannot be undone.'
            )
          }
        >
          <MaterialIcons name='delete-outline' size={20} color={CLTheme.status.danger} />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 2.4.1 (Build 302)</Text>
      </ScrollView>

      <Modal
        visible={showTwoFactorSetup}
        transparent
        animationType='fade'
        onRequestClose={closeTwoFactorSetup}
      >
        <Pressable style={styles.modalOverlay} onPress={closeTwoFactorSetup}>
          <Pressable style={styles.modalCard} onPress={() => null} testID='twofa-setup-modal'>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Up Two-Factor Authentication</Text>
              <TouchableOpacity onPress={closeTwoFactorSetup}>
                <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose how you want to verify future sign-ins.</Text>

            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedTwoFactorMethod === 'sms' ? styles.methodCardActive : null,
                ]}
                onPress={() => {
                  setSelectedTwoFactorMethod('sms')
                  setSetupError('')
                  setSetupInfo('')
                }}
                testID='twofa-method-sms'
              >
                <MaterialIcons name='sms' size={20} color={CLTheme.accent} />
                <Text style={styles.methodTitle}>SMS</Text>
                <Text style={styles.methodHint}>Text message code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedTwoFactorMethod === 'authenticator' ? styles.methodCardActive : null,
                ]}
                onPress={() => {
                  setSelectedTwoFactorMethod('authenticator')
                  setSetupError('')
                  setSetupInfo('')
                }}
                testID='twofa-method-authenticator'
              >
                <MaterialIcons name='verified-user' size={20} color={CLTheme.accent} />
                <Text style={styles.methodTitle}>Authenticator App</Text>
                <Text style={styles.methodHint}>One-time app code</Text>
              </TouchableOpacity>
            </View>

            {selectedTwoFactorMethod === 'sms' ? (
              <View style={styles.methodForm}>
                {hasVerifiedPhone ? (
                  <View style={styles.verifiedPhoneCard}>
                    <Text style={styles.verifiedPhoneLabel}>Connected Phone</Text>
                    <Text style={styles.verifiedPhoneValue}>{formattedPhone}</Text>
                    <Text style={styles.verifiedPhoneHint}>
                      This verified number will be used for SMS sign-in verification.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.unverifiedPhoneCard}>
                    <Text style={styles.unverifiedPhoneTitle}>No verified phone number</Text>
                    <Text style={styles.unverifiedPhoneHint}>
                      Verify your phone under Login & Security before enabling SMS 2FA.
                    </Text>
                    <TouchableOpacity
                      style={styles.verifyPhoneButton}
                      onPress={() => {
                        closeTwoFactorSetup()
                        openPhoneSetup()
                      }}
                      testID='twofa-open-phone-setup-button'
                    >
                      <Text style={styles.verifyPhoneButtonText}>Verify Phone Number</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}

            {selectedTwoFactorMethod === 'authenticator' ? (
              <View style={styles.methodForm}>
                <View style={styles.appKeyCard}>
                  <Text style={styles.appKeyLabel}>Setup Key</Text>
                  <Text style={styles.appKeyValue}>{DEMO_AUTH_APP_KEY}</Text>
                </View>
                <Text style={styles.inputLabel}>Authenticator Code</Text>
                <TextInput
                  value={authAppCode}
                  onChangeText={setAuthAppCode}
                  keyboardType='number-pad'
                  maxLength={6}
                  style={styles.input}
                  placeholder='6-digit code'
                  placeholderTextColor={CLTheme.text.muted}
                  testID='twofa-auth-code-input'
                />
                <Text style={styles.demoHint}>Demo code: {DEMO_AUTH_APP_CODE}</Text>
              </View>
            ) : null}

            {setupInfo ? <Text style={styles.infoText}>{setupInfo}</Text> : null}
            {setupError ? <Text style={styles.errorText}>{setupError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeTwoFactorSetup}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.enableButton, !isEnableActionAllowed ? styles.disabledButton : null]}
                onPress={handleEnableTwoFactor}
                testID='twofa-enable-button'
              >
                <Text style={styles.enableButtonText}>Enable 2FA</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showPhoneSetup}
        transparent
        animationType='fade'
        onRequestClose={closePhoneSetup}
      >
        <Pressable style={styles.modalOverlay} onPress={closePhoneSetup}>
          <Pressable style={styles.modalCard} onPress={() => null} testID='phone-setup-modal'>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Phone Number</Text>
              <TouchableOpacity onPress={closePhoneSetup}>
                <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Add a phone number for security alerts and SMS-based two-factor authentication.
            </Text>

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType='phone-pad'
              style={styles.input}
              placeholder='(555) 000-0000'
              placeholderTextColor={CLTheme.text.muted}
              testID='phone-number-input'
            />

            <View style={styles.smsRow}>
              <View style={styles.smsCodeWrap}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <TextInput
                  value={phoneCode}
                  onChangeText={setPhoneCode}
                  keyboardType='number-pad'
                  maxLength={6}
                  style={styles.input}
                  placeholder='6-digit code'
                  placeholderTextColor={CLTheme.text.muted}
                  testID='phone-code-input'
                />
              </View>
              <TouchableOpacity
                style={[styles.sendCodeButton, !hasValidPhoneInput ? styles.disabledButton : null]}
                onPress={handleSendPhoneCode}
                disabled={!hasValidPhoneInput}
                testID='phone-send-code-button'
              >
                <Text style={styles.sendCodeButtonText}>{phoneCodeSent ? 'Resend' : 'Send Code'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.demoHint}>Demo code: {DEMO_PHONE_VERIFICATION_CODE}</Text>

            {phoneInfo ? <Text style={styles.infoText}>{phoneInfo}</Text> : null}
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closePhoneSetup}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.enableButton, (!hasValidPhoneInput || !phoneCodeSent) && styles.disabledButton]}
                onPress={handleVerifyPhone}
                testID='phone-verify-button'
              >
                <Text style={styles.enableButtonText}>Verify Phone</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 12,
    backgroundColor: CLTheme.background,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueBg: {
    backgroundColor: 'rgba(13, 108, 242, 0.18)',
  },
  greenBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  orangeBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  indigoBg: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  grayBg: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  rowValue: {
    fontSize: 14,
    color: CLTheme.text.secondary,
  },
  emailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '60%',
  },
  phoneRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  phoneBadgeVerified: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  phoneBadgeUnverified: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  phoneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phoneBadgeTextVerified: {
    color: CLTheme.status.success,
  },
  phoneBadgeTextUnverified: {
    color: CLTheme.status.warning,
  },
  rowHint: {
    fontSize: 12,
    marginTop: 1,
    color: CLTheme.text.muted,
  },
  separator: {
    height: 1,
    marginLeft: 56,
    backgroundColor: CLTheme.border,
  },
  deleteButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  deleteText: {
    color: CLTheme.status.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: CLTheme.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
    marginRight: 10,
  },
  modalSubtitle: {
    fontSize: 13,
    color: CLTheme.text.secondary,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  methodCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    padding: 10,
  },
  methodCardActive: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
  },
  methodTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  methodHint: {
    marginTop: 2,
    fontSize: 11,
    color: CLTheme.text.muted,
  },
  methodForm: {
    marginBottom: 8,
  },
  verifiedPhoneCard: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  verifiedPhoneLabel: {
    fontSize: 11,
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  verifiedPhoneValue: {
    fontSize: 14,
    fontWeight: '700',
    color: CLTheme.text.primary,
    marginBottom: 2,
  },
  verifiedPhoneHint: {
    fontSize: 12,
    color: CLTheme.status.success,
  },
  unverifiedPhoneCard: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  unverifiedPhoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 2,
  },
  unverifiedPhoneHint: {
    fontSize: 12,
    color: '#fcd34d',
    marginBottom: 8,
  },
  verifyPhoneButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: CLTheme.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  verifyPhoneButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    backgroundColor: CLTheme.background,
    color: CLTheme.text.primary,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  smsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  smsCodeWrap: {
    flex: 1,
  },
  sendCodeButton: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    justifyContent: 'center',
    marginBottom: 10,
  },
  sendCodeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  appKeyCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  appKeyLabel: {
    fontSize: 11,
    color: CLTheme.text.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  appKeyValue: {
    fontSize: 13,
    color: CLTheme.text.primary,
    fontWeight: '700',
  },
  demoHint: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 11,
    color: CLTheme.text.muted,
  },
  infoText: {
    color: CLTheme.status.success,
    fontSize: 12,
    marginBottom: 6,
  },
  errorText: {
    color: CLTheme.status.danger,
    fontSize: 12,
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CLTheme.background,
  },
  cancelButtonText: {
    color: CLTheme.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  enableButton: {
    flex: 1,
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CLTheme.accent,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
  },
})
