import React, { useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { CLThemeTokens, useCLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'
import { isValidEmailAddress } from '../../utils/validation'

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/

const getPasswordRequirements = (value: string) => ({
  minLength: value.length >= 12,
  hasUppercase: /[A-Z]/.test(value),
  hasLowercase: /[a-z]/.test(value),
  hasNumber: /\d/.test(value),
  hasSpecialChar: SPECIAL_CHAR_REGEX.test(value),
})

const isValidResetLink = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const url = new URL(trimmed)
    const hasToken = Boolean(
      url.searchParams.get('token') ||
        url.searchParams.get('code') ||
        url.searchParams.get('oobCode')
    )
    const pathLooksLikeReset = /reset|recover/i.test(url.pathname) || /reset|recover/i.test(url.href)
    return hasToken || pathLooksLikeReset
  } catch {
    return false
  }
}

export function ForgotPasswordScreen({ navigation }: any) {
  const clTheme = useCLTheme()
  const styles = getStyles(clTheme)
  const [email, setEmail] = useState('')
  const [verificationLink, setVerificationLink] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const passwordRequirements = useMemo(() => getPasswordRequirements(newPassword), [newPassword])
  const markPasswordResetRequested = useUserProfileStore(state => state.markPasswordResetRequested)
  const markPasswordResetVerified = useUserProfileStore(state => state.markPasswordResetVerified)
  const addActivityLogEntry = useUserProfileStore(state => state.addActivityLogEntry)

  const handleSend = () => {
    const trimmed = email.trim()
    if (!isValidEmailAddress(trimmed)) {
      Alert.alert('Invalid email', 'Enter the account email to reset your password.')
      return
    }

    markPasswordResetRequested(trimmed)
    addActivityLogEntry({
      eventType: 'security_update',
      source: 'account_security',
      title: 'Password reset requested',
      description: `Password reset link requested for ${trimmed}.`,
    })

    Alert.alert('Reset link sent', `We sent password reset instructions to ${trimmed}.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  const handleResetWithLink = () => {
    if (!isValidResetLink(verificationLink)) {
      Alert.alert('Invalid link', 'Paste a valid verification link from your email.')
      return
    }

    const unmetRequirements = Object.values(passwordRequirements).some(value => !value)
    if (unmetRequirements) {
      Alert.alert(
        'Weak password',
        'Use at least 12 characters with uppercase, lowercase, number, and special character.'
      )
      return
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Password mismatch', 'Confirm password must match the new password.')
      return
    }

    markPasswordResetVerified()
    addActivityLogEntry({
      eventType: 'security_update',
      source: 'account_security',
      title: 'Password reset completed',
      description: 'Password was updated using verification link.',
    })

    Alert.alert('Password updated', 'Your password has been reset successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
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
          <Text style={styles.title}>Forgot Password</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Enter the email on your account and we will send a password reset link.
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder='name@company.com'
            placeholderTextColor={clTheme.text.muted}
            autoCapitalize='none'
            keyboardType='email-address'
            testID='forgot-password-email-input'
          />
          <TouchableOpacity style={styles.button} onPress={handleSend} testID='forgot-password-submit'>
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Already have the link?</Text>
          <TextInput
            style={styles.input}
            value={verificationLink}
            onChangeText={setVerificationLink}
            placeholder='Paste verification link'
            placeholderTextColor={clTheme.text.muted}
            autoCapitalize='none'
            testID='forgot-password-link-input'
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder='New password'
            placeholderTextColor={clTheme.text.muted}
            secureTextEntry
            testID='forgot-password-new-password-input'
          />
          <TextInput
            style={styles.input}
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            placeholder='Confirm new password'
            placeholderTextColor={clTheme.text.muted}
            secureTextEntry
            testID='forgot-password-confirm-password-input'
          />
          <View style={styles.requirementsCard}>
            {[
              ['12+ characters', passwordRequirements.minLength],
              ['Uppercase letter', passwordRequirements.hasUppercase],
              ['Lowercase letter', passwordRequirements.hasLowercase],
              ['Number', passwordRequirements.hasNumber],
              ['Special character', passwordRequirements.hasSpecialChar],
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
          <TouchableOpacity
            style={styles.button}
            onPress={handleResetWithLink}
            testID='forgot-password-verify-link-submit'
          >
            <Text style={styles.buttonText}>Verify Link & Reset Password</Text>
          </TouchableOpacity>
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
    sectionTitle: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '700',
      color: clTheme.text.primary,
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
  })
