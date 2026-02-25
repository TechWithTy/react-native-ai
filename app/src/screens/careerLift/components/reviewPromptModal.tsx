import React from 'react'
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from '../theme'
import { ModalContainer } from './modalContainer'

type ReviewPromptModalProps = {
  visible: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  primaryLabel?: string
  secondaryLabel?: string
  tertiaryLabel?: string
  storeUrl?: string
  fallbackUrl?: string
  dismissible?: boolean
  hardWall?: boolean
  rewardCredits?: number
  onRateNow?: () => void
  onDetectReviewLeft?: () => Promise<boolean> | boolean
  onRewardCredits?: (amount: number) => void
  onLater?: () => void
  onNoThanks?: () => void
}

export function ReviewPromptModal({
  visible,
  onClose,
  title = 'Enjoying Career Lift?',
  subtitle = 'A quick review helps other job seekers discover the app.',
  primaryLabel = 'Leave a Review',
  secondaryLabel = 'Maybe Later',
  tertiaryLabel = 'No Thanks',
  storeUrl,
  fallbackUrl = 'https://careerlift.ai',
  dismissible = true,
  hardWall = false,
  rewardCredits = 0,
  onRateNow,
  onDetectReviewLeft,
  onRewardCredits,
  onLater,
  onNoThanks,
}: ReviewPromptModalProps) {
  const allowDismiss = dismissible && !hardWall

  const maybeGrantReviewReward = async () => {
    if (rewardCredits <= 0) return

    let reviewConfirmed = true
    if (onDetectReviewLeft) {
      try {
        reviewConfirmed = await Promise.resolve(onDetectReviewLeft())
      } catch {
        reviewConfirmed = false
      }
    }

    if (reviewConfirmed) onRewardCredits?.(rewardCredits)
  }

  const handleRateNow = async () => {
    if (onRateNow) {
      onRateNow()
      await maybeGrantReviewReward()
      onClose()
      return
    }

    const targetUrl = storeUrl || fallbackUrl
    try {
      const canOpen = await Linking.canOpenURL(targetUrl)
      if (!canOpen) {
        Alert.alert('Unable to open store', 'Please try again later.')
        return
      }
      await Linking.openURL(targetUrl)
      await maybeGrantReviewReward()
      onClose()
    } catch {
      Alert.alert('Unable to open store', 'Please try again later.')
    }
  }

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      animationType='fade'
      closeOnBackdropPress={allowDismiss}
      isHardWall={!allowDismiss}
      backdropTestID='review-prompt-modal-backdrop'
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialIcons name='rate-review' size={20} color={CLTheme.accent} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {rewardCredits > 0 ? (
          <View style={styles.rewardBanner}>
            <MaterialIcons name='payments' size={14} color={CLTheme.status.success} />
            <Text style={styles.rewardText}>Leave a review to earn +{rewardCredits} credits</Text>
          </View>
        ) : null}

        <View style={styles.starRow}>
          {[0, 1, 2, 3, 4].map(index => (
            <MaterialIcons key={index} name='star' size={20} color='#fbbf24' />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRateNow}
          activeOpacity={0.9}
          testID='review-prompt-rate-now'
        >
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>

        {allowDismiss ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              onLater?.()
              onClose()
            }}
            activeOpacity={0.9}
            testID='review-prompt-later'
          >
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {allowDismiss ? (
          <TouchableOpacity
            onPress={() => {
              onNoThanks?.()
              onClose()
            }}
            activeOpacity={0.85}
            testID='review-prompt-no-thanks'
          >
            <Text style={styles.tertiaryText}>{tertiaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ModalContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: CLTheme.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: CLTheme.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  rewardText: {
    color: CLTheme.status.success,
    fontSize: 12,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  primaryButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: CLTheme.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tertiaryText: {
    color: CLTheme.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
})
