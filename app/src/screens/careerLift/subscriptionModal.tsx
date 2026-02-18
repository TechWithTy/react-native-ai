import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from './theme'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

const { width } = Dimensions.get('window')

// ─── Tier Definitions ────────────────────────────────────────────
export interface SubscriptionTier {
  id: 'starter' | 'pro' | 'unlimited'
  name: string
  price: string
  period: string
  badge?: string
  credits: string
  highlight: boolean
  features: { text: string; icon: string; included: boolean }[]
}

export const TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    period: '/month',
    credits: '50 credits/mo',
    highlight: false,
    features: [
      { text: '50 AI credits per month', icon: 'zap', included: true },
      { text: 'Basic interview prep', icon: 'mic', included: true },
      { text: 'Job tracking (up to 25)', icon: 'briefcase', included: true },
      { text: 'Manual job applications', icon: 'send', included: true },
      { text: 'AI resume tailoring', icon: 'file-text', included: false },
      { text: 'Automated apply', icon: 'repeat', included: false },
      { text: 'Priority AI models', icon: 'cpu', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    badge: 'MOST POPULAR',
    credits: '300 credits/mo',
    highlight: true,
    features: [
      { text: '300 AI credits per month', icon: 'zap', included: true },
      { text: 'Advanced interview coaching', icon: 'mic', included: true },
      { text: 'Unlimited job tracking', icon: 'briefcase', included: true },
      { text: 'AI-powered auto-apply (30/mo)', icon: 'repeat', included: true },
      { text: 'AI resume tailoring', icon: 'file-text', included: true },
      { text: 'Cover letter generation', icon: 'edit-3', included: true },
      { text: 'Priority AI models', icon: 'cpu', included: false },
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$39',
    period: '/month',
    badge: 'BEST VALUE',
    credits: 'Unlimited credits',
    highlight: false,
    features: [
      { text: 'Unlimited AI credits', icon: 'zap', included: true },
      { text: 'Priority AI models (GPT-4o)', icon: 'cpu', included: true },
      { text: 'Unlimited job tracking', icon: 'briefcase', included: true },
      { text: 'Unlimited auto-apply', icon: 'repeat', included: true },
      { text: 'AI resume tailoring', icon: 'file-text', included: true },
      { text: 'Cover letter generation', icon: 'edit-3', included: true },
      { text: 'Dedicated support', icon: 'headphones', included: true },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────
interface SubscriptionModalProps {
  visible: boolean
  onClose: () => void
  currentBalance?: number
}

// ─── Component ────────────────────────────────────────────────────
export function SubscriptionModal({ visible, onClose, currentBalance = 0 }: SubscriptionModalProps) {
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'unlimited'>('pro')

  const handleSubscribe = () => {
    // Placeholder — would integrate with payment SDK
    alert(`Subscribing to ${TIERS.find(t => t.id === selectedTier)?.name} plan!`)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Upgrade Your Career</Text>
              <Text style={styles.subtitle}>Unlock AI-powered job hunting</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Low balance nudge */}
          {currentBalance <= 30 && currentBalance > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.nudgeBanner}>
              <Feather name="alert-circle" size={16} color="#f59e0b" />
              <Text style={styles.nudgeText}>
                You have <Text style={{fontWeight: '700', color: '#f59e0b'}}>{currentBalance}</Text> credits remaining
              </Text>
            </Animated.View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Tier Cards */}
            {TIERS.map((tier, index) => {
              const isSelected = selectedTier === tier.id
              return (
                <Animated.View
                  key={tier.id}
                  entering={FadeInDown.delay(150 + index * 80).duration(400)}
                >
                  <TouchableOpacity
                    style={[
                      styles.tierCard,
                      tier.highlight && styles.tierCardHighlight,
                      isSelected && styles.tierCardSelected,
                    ]}
                    onPress={() => setSelectedTier(tier.id)}
                    activeOpacity={0.8}
                  >
                    {/* Badge */}
                    {tier.badge && (
                      <View style={[styles.badge, tier.id === 'unlimited' && styles.badgeGold]}>
                        <Text style={styles.badgeText}>{tier.badge}</Text>
                      </View>
                    )}

                    {/* Tier Header */}
                    <View style={styles.tierHeader}>
                      <View style={{flex: 1}}>
                        <Text style={styles.tierName}>{tier.name}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                          <Text style={styles.tierPrice}>{tier.price}</Text>
                          <Text style={styles.tierPeriod}>{tier.period}</Text>
                        </View>
                      </View>

                      {/* Selection indicator */}
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>

                    {/* Credits pill */}
                    <View style={[styles.creditsPill, tier.id === 'unlimited' && styles.creditsPillGold]}>
                      <Feather name="zap" size={14} color={tier.id === 'unlimited' ? '#fbbf24' : CLTheme.accent} />
                      <Text style={[styles.creditsPillText, tier.id === 'unlimited' && {color: '#fbbf24'}]}>
                        {tier.credits}
                      </Text>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresList}>
                      {tier.features.map((feat, i) => (
                        <View key={i} style={styles.featureRow}>
                          <Feather
                            name={feat.included ? 'check' : 'x'}
                            size={14}
                            color={feat.included ? '#10b981' : CLTheme.text.muted}
                          />
                          <Text style={[styles.featureText, !feat.included && styles.featureTextDisabled]}>
                            {feat.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )
            })}

            {/* Social proof */}
            <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.socialProof}>
              <MaterialIcons name="verified" size={18} color="#10b981" />
              <Text style={styles.socialProofText}>
                Trusted by <Text style={{fontWeight: '700', color: CLTheme.text.primary}}>12,400+</Text> job seekers
              </Text>
            </Animated.View>
          </ScrollView>

          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={[styles.ctaButton, selectedTier === 'starter' && styles.ctaButtonFree]}
              onPress={handleSubscribe}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>
                {selectedTier === 'starter' ? 'Continue with Free' : `Subscribe to ${TIERS.find(t => t.id === selectedTier)?.name}`}
              </Text>
              {selectedTier !== 'starter' && (
                <Text style={styles.ctaSubtext}>Cancel anytime · 7 day free trial</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: CLTheme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: CLTheme.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: CLTheme.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: CLTheme.text.secondary,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
    marginTop: 2,
  },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  nudgeText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  // ── Tier Card ──────────────────
  tierCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: CLTheme.border,
  },
  tierCardHighlight: {
    borderColor: CLTheme.accent,
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  tierCardSelected: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.06)',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: CLTheme.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeGold: {
    backgroundColor: '#92400e',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  tierPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: CLTheme.text.primary,
  },
  tierPeriod: {
    fontSize: 13,
    color: CLTheme.text.muted,
    marginLeft: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CLTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: CLTheme.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CLTheme.accent,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 108, 242, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  creditsPillGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  creditsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.accent,
  },
  featuresList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
  },
  featureTextDisabled: {
    color: CLTheme.text.muted,
    textDecorationLine: 'line-through',
  },
  // ── Social Proof ────────────────
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  socialProofText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
  },
  // ── CTA ─────────────────────────
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  ctaButton: {
    backgroundColor: CLTheme.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonFree: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ctaSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
})
