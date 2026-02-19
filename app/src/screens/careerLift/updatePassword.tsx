import React, { useMemo, useState } from 'react'
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

type PasswordRule = {
  id: string
  label: string
  met: boolean
}

function getPasswordRules(password: string): PasswordRule[] {
  return [
    { id: 'length', label: 'At least 12 characters', met: password.length >= 12 },
    { id: 'uppercase', label: 'At least 1 uppercase letter', met: /[A-Z]/.test(password) },
    { id: 'number', label: 'At least 1 number', met: /\d/.test(password) },
    { id: 'special', label: 'At least 1 special character (!@#$)', met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function UpdatePasswordScreen() {
  const navigation = useNavigation<any>()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false)

  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword])
  const hasStrongPassword = passwordRules.every(rule => rule.met)
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword !== currentPassword
  const doesConfirmMatch = confirmPassword.length > 0 && confirmPassword === newPassword
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    hasStrongPassword &&
    isDifferentFromCurrent &&
    doesConfirmMatch

  const passwordStrengthLabel = hasStrongPassword
    ? 'Strong password'
    : newPassword.length > 0
      ? 'Keep going'
      : 'Start typing'

  const passwordStrengthColor = hasStrongPassword ? '#34d399' : CLTheme.text.muted

  const getSubmitError = () => {
    if (!currentPassword) return 'Enter your current password.'
    if (!newPassword) return 'Enter a new password.'
    if (!hasStrongPassword) return 'Your new password does not meet all requirements.'
    if (!isDifferentFromCurrent) return 'New password must be different from your current password.'
    if (!confirmPassword) return 'Confirm your new password.'
    if (!doesConfirmMatch) return 'Confirm password must match the new password.'
    return ''
  }

  const submitError = didAttemptSubmit ? getSubmitError() : ''

  const handleSubmit = () => {
    setDidAttemptSubmit(true)
    if (!canSubmit) return

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setDidAttemptSubmit(false)

    Alert.alert(
      'Password Updated',
      'Your password has been updated and other active sessions were signed out.',
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='arrow-back-ios-new' size={20} color={CLTheme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>Create a strong password</Text>
          <Text style={styles.introText}>
            Your new password must be different from passwords used before for your Career Lift
            account.
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder='Enter current password'
              placeholderTextColor={CLTheme.text.muted}
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize='none'
              testID='current-password-input'
            />
            <TouchableOpacity onPress={() => setShowCurrent(prev => !prev)}>
              <MaterialIcons
                name={showCurrent ? 'visibility-off' : 'visibility'}
                size={20}
                color={CLTheme.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>New Password</Text>
          <View style={[styles.inputContainer, newPassword.length > 0 && styles.inputContainerFocused]}>
            <TextInput
              style={styles.input}
              placeholder='At least 12 characters'
              placeholderTextColor={CLTheme.text.muted}
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize='none'
              testID='new-password-input'
            />
            <TouchableOpacity onPress={() => setShowNew(prev => !prev)}>
              <MaterialIcons
                name={showNew ? 'visibility-off' : 'visibility'}
                size={20}
                color={CLTheme.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.strengthRow}>
            {passwordRules.map(rule => (
              <View
                key={rule.id}
                style={[styles.strengthSegment, rule.met ? styles.strengthSegmentMet : null]}
              />
            ))}
          </View>
          <Text style={[styles.strengthText, { color: passwordStrengthColor }]}>{passwordStrengthLabel}</Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder='Re-enter new password'
              placeholderTextColor={CLTheme.text.muted}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize='none'
              testID='confirm-password-input'
            />
            <TouchableOpacity onPress={() => setShowConfirm(prev => !prev)}>
              <MaterialIcons
                name={showConfirm ? 'visibility-off' : 'visibility'}
                size={20}
                color={CLTheme.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>PASSWORD REQUIREMENTS</Text>
          {passwordRules.map(rule => (
            <View key={rule.id} style={styles.ruleRow}>
              <MaterialIcons
                name={rule.met ? 'check-circle' : 'radio-button-unchecked'}
                size={18}
                color={rule.met ? '#34d399' : CLTheme.text.muted}
              />
              <Text style={styles.ruleText}>{rule.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <MaterialIcons name='info-outline' size={18} color={CLTheme.status.warning} />
          <View style={styles.noticeTextWrap}>
            <Text style={styles.noticeTitle}>Session Logout</Text>
            <Text style={styles.noticeText}>
              Updating your password will sign out active sessions on other devices.
            </Text>
          </View>
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          testID='update-password-button'
        >
          <Text style={styles.submitText}>Update Password</Text>
          <MaterialIcons name='lock-reset' size={20} color='#fff' />
        </TouchableOpacity>
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
    marginBottom: 20,
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
  fieldBlock: {
    marginBottom: 14,
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
  inputContainerFocused: {
    borderColor: CLTheme.accent,
  },
  input: {
    flex: 1,
    color: CLTheme.text.primary,
    fontSize: 14,
  },
  strengthRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#334155',
  },
  strengthSegmentMet: {
    backgroundColor: '#34d399',
  },
  strengthText: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  rulesCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    backgroundColor: CLTheme.card,
    padding: 14,
    marginTop: 8,
  },
  rulesTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: CLTheme.text.muted,
    marginBottom: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
  },
  ruleText: {
    color: CLTheme.text.secondary,
    fontSize: 13,
  },
  noticeCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  noticeTextWrap: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#fcd34d',
  },
  errorText: {
    marginTop: 12,
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
  submitButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
