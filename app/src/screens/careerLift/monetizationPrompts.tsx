import React, { useMemo, useState } from 'react'
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from './theme'
import { MonetizationCopyVariant } from '../../store/monetizationExperimentsStore'
import { SubscriptionModal } from './subscriptionModal'
import { CreditPacksDrawer } from './components/creditPacksDrawer'
import { ReviewPromptModal } from './components/reviewPromptModal'
import { useCreditsStore } from '../../store/creditsStore'
import { useUserProfileStore } from '../../store/userProfileStore'
import { ModalContainer } from './components/modalContainer'

type ReviewCopyMode = 'post_interview' | 'weekly_progress' | 'offer_milestone'
type PaywallSurface = 'subscription' | 'ai_credits' | 'scan_credits'

const COPY_VARIANTS: MonetizationCopyVariant[] = ['classic', 'value', 'urgency']
const REVIEW_COPY_MODES: ReviewCopyMode[] = ['post_interview', 'weekly_progress', 'offer_milestone']
const REVIEW_REWARD_OPTIONS = [0, 25, 50, 100] as const
const REQUIRED_TIER_OPTIONS = ['none', 'starter', 'pro', 'unlimited'] as const
const REQUIRED_AI_CREDIT_OPTIONS = [0, 50, 150, 500] as const
const REQUIRED_SCAN_CREDIT_OPTIONS = [0, 10, 25, 60] as const

export function MonetizationPromptsScreen({ navigation }: any) {
  const [copyVariant, setCopyVariant] = useState<MonetizationCopyVariant>('classic')
  const [reviewMode, setReviewMode] = useState<ReviewCopyMode>('weekly_progress')
  const [activeSurface, setActiveSurface] = useState<PaywallSurface>('subscription')
  const [showReviewPrompt, setShowReviewPrompt] = useState(false)
  const [hardWallEnabled, setHardWallEnabled] = useState(false)
  const [reviewDismissible, setReviewDismissible] = useState(true)
  const [reviewRewardCredits, setReviewRewardCredits] = useState<number>(0)
  const [reviewRewardGranted, setReviewRewardGranted] = useState(false)
  const [simulateReviewLeft, setSimulateReviewLeft] = useState(true)
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false)
  const [rewardSuccessAmount, setRewardSuccessAmount] = useState(0)
  const [requiredTier, setRequiredTier] = useState<(typeof REQUIRED_TIER_OPTIONS)[number]>('none')
  const [requiredAiCredits, setRequiredAiCredits] = useState<number>(0)
  const [requiredScanCredits, setRequiredScanCredits] = useState<number>(0)

  const [showSubscription, setShowSubscription] = useState(false)
  const [showAiCredits, setShowAiCredits] = useState(false)
  const [showScanCredits, setShowScanCredits] = useState(false)
  const addCredits = useCreditsStore(state => state.addCredits)
  const claimFirstReviewReward = useUserProfileStore(state => state.claimFirstReviewReward)

  const reviewCopy = useMemo(() => {
    if (reviewMode === 'post_interview') {
      return {
        title: 'Nice progress on interview prep',
        subtitle: 'If Career Lift helped you prep faster, leave a quick review.',
      }
    }
    if (reviewMode === 'offer_milestone') {
      return {
        title: 'Congrats on your milestone',
        subtitle: 'Share your experience so others can get there too.',
      }
    }
    return {
      title: 'Enjoying your weekly momentum?',
      subtitle: 'A short review helps us improve and helps others trust Career Lift.',
    }
  }, [reviewMode])

  const defaultStoreUrl =
    Platform.OS === 'android'
      ? 'market://details?id=com.anonymous.app'
      : 'itms-apps://itunes.apple.com/app/id0000000000?action=write-review'

  const openPaywallSurface = () => {
    if (activeSurface === 'subscription') {
      setShowSubscription(true)
      return
    }
    if (activeSurface === 'ai_credits') {
      setShowAiCredits(true)
      return
    }
    setShowScanCredits(true)
  }

  const handleRewardCredits = (amount: number) => {
    if (amount <= 0 || reviewRewardGranted) return
    const claimed = claimFirstReviewReward(amount)
    if (!claimed) {
      Alert.alert('Reward already claimed', 'The one-time review reward has already been used.')
      return
    }
    addCredits(amount)
    setReviewRewardGranted(true)
    setRewardSuccessAmount(amount)
    setShowRewardSuccessModal(true)
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel='Go back'
          >
            <MaterialIcons name='chevron-left' size={24} color={CLTheme.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Prompts & Paywalls</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYWALL PREVIEW</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Surface</Text>
            <View style={styles.chipsRow}>
              {(['subscription', 'ai_credits', 'scan_credits'] as const).map(surface => {
                const selected = activeSurface === surface
                return (
                  <TouchableOpacity
                    key={surface}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setActiveSurface(surface)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{surface}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Copy Variant</Text>
            <View style={styles.chipsRow}>
              {COPY_VARIANTS.map(variant => {
                const selected = copyVariant === variant
                return (
                  <TouchableOpacity
                    key={variant}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setCopyVariant(variant)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{variant}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Gate Mode</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, !hardWallEnabled && styles.chipActive]}
                onPress={() => setHardWallEnabled(false)}
              >
                <Text style={[styles.chipText, !hardWallEnabled && styles.chipTextActive]}>dismissable</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, hardWallEnabled && styles.chipActive]}
                onPress={() => setHardWallEnabled(true)}
              >
                <Text style={[styles.chipText, hardWallEnabled && styles.chipTextActive]}>hard wall</Text>
              </TouchableOpacity>
            </View>
            {activeSurface === 'subscription' ? (
              <>
                <Text style={[styles.cardTitle, { marginTop: 14 }]}>Required Subscription Tier</Text>
                <View style={styles.chipsRow}>
                  {REQUIRED_TIER_OPTIONS.map(tier => {
                    const selected = requiredTier === tier
                    return (
                      <TouchableOpacity
                        key={tier}
                        style={[styles.chip, selected && styles.chipActive]}
                        onPress={() => setRequiredTier(tier)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{tier}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            ) : null}
            {activeSurface === 'ai_credits' ? (
              <>
                <Text style={[styles.cardTitle, { marginTop: 14 }]}>Required AI Credits</Text>
                <View style={styles.chipsRow}>
                  {REQUIRED_AI_CREDIT_OPTIONS.map(amount => {
                    const selected = requiredAiCredits === amount
                    return (
                      <TouchableOpacity
                        key={amount}
                        style={[styles.chip, selected && styles.chipActive]}
                        onPress={() => setRequiredAiCredits(amount)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                          {amount === 0 ? 'off' : amount}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            ) : null}
            {activeSurface === 'scan_credits' ? (
              <>
                <Text style={[styles.cardTitle, { marginTop: 14 }]}>Required Scan Credits</Text>
                <View style={styles.chipsRow}>
                  {REQUIRED_SCAN_CREDIT_OPTIONS.map(amount => {
                    const selected = requiredScanCredits === amount
                    return (
                      <TouchableOpacity
                        key={amount}
                        style={[styles.chip, selected && styles.chipActive]}
                        onPress={() => setRequiredScanCredits(amount)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                          {amount === 0 ? 'off' : amount}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            ) : null}

            <TouchableOpacity style={styles.cta} onPress={openPaywallSurface}>
              <MaterialIcons name='ads-click' size={16} color='#fff' />
              <Text style={styles.ctaText}>Open Selected Paywall</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REVIEW PROMPT</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prompt Context</Text>
            <View style={styles.chipsRow}>
              {REVIEW_COPY_MODES.map(mode => {
                const selected = reviewMode === mode
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setReviewMode(mode)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{mode}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>{reviewCopy.title}</Text>
              <Text style={styles.previewSubtitle}>{reviewCopy.subtitle}</Text>
            </View>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Review Reward Credits</Text>
            <View style={styles.chipsRow}>
              {REVIEW_REWARD_OPTIONS.map(amount => {
                const selected = reviewRewardCredits === amount
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setReviewRewardCredits(amount)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {amount === 0 ? 'off' : `+${amount}`}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Review Prompt Dismissal</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, reviewDismissible && styles.chipActive]}
                onPress={() => setReviewDismissible(true)}
              >
                <Text style={[styles.chipText, reviewDismissible && styles.chipTextActive]}>dismissible</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, !reviewDismissible && styles.chipActive]}
                onPress={() => setReviewDismissible(false)}
              >
                <Text style={[styles.chipText, !reviewDismissible && styles.chipTextActive]}>hard wall</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Review Detection Callback</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, simulateReviewLeft && styles.chipActive]}
                onPress={() => setSimulateReviewLeft(true)}
              >
                <Text style={[styles.chipText, simulateReviewLeft && styles.chipTextActive]}>returns true</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, !simulateReviewLeft && styles.chipActive]}
                onPress={() => setSimulateReviewLeft(false)}
              >
                <Text style={[styles.chipText, !simulateReviewLeft && styles.chipTextActive]}>returns false</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cta}
              onPress={() => {
                setReviewRewardGranted(false)
                setShowReviewPrompt(true)
              }}
            >
              <MaterialIcons name='rate-review' size={16} color='#fff' />
              <Text style={styles.ctaText}>Open Review Prompt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
        copyVariant={copyVariant}
        hardWall={hardWallEnabled}
        requiredTierId={requiredTier === 'none' ? null : requiredTier}
      />

      <CreditPacksDrawer
        visible={showAiCredits}
        onClose={() => setShowAiCredits(false)}
        mode='ai_credits'
        copyVariant={copyVariant}
        hardWall={hardWallEnabled}
        requiredAmount={requiredAiCredits}
        onSeePlansInstead={() => {
          setShowAiCredits(false)
          setShowSubscription(true)
        }}
      />

      <CreditPacksDrawer
        visible={showScanCredits}
        onClose={() => setShowScanCredits(false)}
        mode='scan_credits'
        copyVariant={copyVariant}
        hardWall={hardWallEnabled}
        requiredAmount={requiredScanCredits}
        onSeePlansInstead={() => {
          setShowScanCredits(false)
          setShowSubscription(true)
        }}
      />

      <ReviewPromptModal
        visible={showReviewPrompt}
        onClose={() => setShowReviewPrompt(false)}
        title={reviewCopy.title}
        subtitle={reviewCopy.subtitle}
        dismissible={reviewDismissible}
        hardWall={!reviewDismissible}
        rewardCredits={reviewRewardCredits}
        onRewardCredits={handleRewardCredits}
        onDetectReviewLeft={() => simulateReviewLeft}
        storeUrl={defaultStoreUrl}
        fallbackUrl='https://careerlift.ai/review'
        onLater={() => Alert.alert('No problem', 'We will remind you later.')}
      />

      <ModalContainer
        visible={showRewardSuccessModal}
        onClose={() => setShowRewardSuccessModal(false)}
        animationType='fade'
        backdropTestID='review-reward-success-backdrop'
      >
        <View style={styles.rewardSuccessCard}>
          <View style={styles.rewardSuccessIcon}>
            <MaterialIcons name='verified' size={24} color={CLTheme.status.success} />
          </View>
          <Text style={styles.rewardSuccessTitle}>Review Reward Unlocked</Text>
          <Text style={styles.rewardSuccessSubtitle}>+{rewardSuccessAmount} credits have been added.</Text>
          <TouchableOpacity
            style={styles.rewardSuccessButton}
            onPress={() => setShowRewardSuccessModal(false)}
            activeOpacity={0.9}
          >
            <Text style={styles.rewardSuccessButtonText}>Awesome</Text>
          </TouchableOpacity>
        </View>
      </ModalContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: CLTheme.text.primary,
    fontSize: 19,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 14,
  },
  cardTitle: {
    color: CLTheme.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  chipText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: CLTheme.accent,
  },
  cta: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  previewBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    padding: 10,
  },
  previewTitle: {
    color: CLTheme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewSubtitle: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  rewardSuccessCard: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  rewardSuccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  rewardSuccessTitle: {
    color: CLTheme.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  rewardSuccessSubtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: CLTheme.text.secondary,
    fontSize: 13,
    textAlign: 'center',
  },
  rewardSuccessButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardSuccessButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
})
