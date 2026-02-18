import React from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from '../theme'
import { useCreditsStore } from '../../../store/creditsStore'
import { ModalContainer } from './modalContainer'
import { MonetizationCopyVariant } from '../../../store/monetizationExperimentsStore'

type CreditDrawerMode = 'ai_credits' | 'scan_credits'

type AiCreditPack = {
  id: string
  amount: number
  price: string
  perUnit: string
  popular: boolean
}

const AI_CREDIT_PACKS: AiCreditPack[] = [
  { id: 'pack_50', amount: 50, price: '$4.99', perUnit: '$0.10', popular: false },
  { id: 'pack_150', amount: 150, price: '$9.99', perUnit: '$0.07', popular: true },
  { id: 'pack_500', amount: 500, price: '$24.99', perUnit: '$0.05', popular: false },
  { id: 'pack_1000', amount: 1000, price: '$39.99', perUnit: '$0.04', popular: false },
]

const SCAN_CREDIT_PACKS: AiCreditPack[] = [
  { id: 'scan_pack_10', amount: 10, price: '$4.99', perUnit: '$0.50', popular: false },
  { id: 'scan_pack_25', amount: 25, price: '$9.99', perUnit: '$0.40', popular: true },
  { id: 'scan_pack_60', amount: 60, price: '$19.99', perUnit: '$0.33', popular: false },
]

function resolveCopy(mode: CreditDrawerMode, copyVariant: MonetizationCopyVariant) {
  const defaults =
    mode === 'ai_credits'
      ? {
          title: 'Buy AI Credits',
          subtitle: 'One-time credit packs — use them for mock interviews, AI applications, and more.',
        }
      : {
          title: 'Buy Scan Credits',
          subtitle: 'One-time scan packs for job market scans and ATS resume scans.',
        }

  if (copyVariant === 'value') {
    return {
      ...defaults,
      subtitle:
        mode === 'ai_credits'
          ? 'Save more with larger packs and keep your AI workflow uninterrupted.'
          : 'Add scan packs now to avoid interruptions in your job and ATS scan flow.',
    }
  }

  if (copyVariant === 'urgency') {
    return {
      ...defaults,
      subtitle:
        mode === 'ai_credits'
          ? 'Keep momentum: add credits before your next AI-powered application session.'
          : 'Keep momentum: add scans now so upcoming scan sessions do not pause.',
    }
  }

  return defaults
}

interface CreditPacksDrawerProps {
  visible: boolean
  onClose: () => void
  mode: CreditDrawerMode
  onSeePlansInstead: () => void
  copyVariant?: MonetizationCopyVariant
}

export function CreditPacksDrawer({
  visible,
  onClose,
  mode,
  onSeePlansInstead,
  copyVariant = 'classic',
}: CreditPacksDrawerProps) {
  const addCredits = useCreditsStore(state => state.addCredits)
  const addScanCredits = useCreditsStore(state => state.addScanCredits)

  const packs = mode === 'ai_credits' ? AI_CREDIT_PACKS : SCAN_CREDIT_PACKS
  const copy = resolveCopy(mode, copyVariant)
  const backdropTestID = mode === 'ai_credits' ? 'credit-packages-modal-backdrop' : 'scan-packages-modal-backdrop'

  const handlePurchase = (pack: AiCreditPack) => {
    const labelNoun = mode === 'ai_credits' ? 'credits' : 'scans'
    const confirmationTitle = mode === 'ai_credits' ? 'Purchase Credits' : 'Purchase Scan Credits'
    const successTitle = mode === 'ai_credits' ? 'Credits Added!' : 'Scan Credits Added!'
    const confirmationMessage = `Add ${pack.amount} ${labelNoun} for ${pack.price}?`
    const successMessage = `${pack.amount} ${labelNoun} have been added to your account.`

    Alert.alert(confirmationTitle, confirmationMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Buy Now',
        onPress: () => {
          if (mode === 'ai_credits') {
            addCredits(pack.amount)
          } else {
            addScanCredits(pack.amount, `Purchased ${pack.amount} scan credits`)
          }
          onClose()
          Alert.alert(successTitle, successMessage)
        },
      },
    ])
  }

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      animationType='slide'
      backdropTestID={backdropTestID}
    >
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{copy.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name='close' size={22} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalSubtitle}>{copy.subtitle}</Text>

        <View style={styles.packagesContainer}>
          {packs.map(pack => (
            <TouchableOpacity
              key={pack.id}
              style={[styles.packageCard, pack.popular && styles.packageCardPopular]}
              activeOpacity={0.8}
              onPress={() => handlePurchase(pack)}
            >
              {pack.popular && (
                <View style={styles.packageBadge}>
                  <Text style={styles.packageBadgeText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.packageCreditsRow}>
                {mode === 'ai_credits' ? (
                  <Feather name='zap' size={18} color={pack.popular ? '#fbbf24' : CLTheme.accent} />
                ) : (
                  <MaterialIcons name='radar' size={18} color={pack.popular ? '#fbbf24' : CLTheme.accent} />
                )}
                <Text style={styles.packageCreditsText}>{pack.amount}</Text>
                <Text style={styles.packageCreditsLabel}>{mode === 'ai_credits' ? 'credits' : 'scans'}</Text>
              </View>
              <Text style={styles.packagePrice}>{pack.price}</Text>
              <Text style={styles.packagePerCredit}>
                {pack.perUnit}/{mode === 'ai_credits' ? 'credit' : 'scan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#a855f7' }]}
            onPress={() => {
              onClose()
              onSeePlansInstead()
            }}
          >
            <Text style={styles.primaryButtonText}>See Plans Instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalContainer>
  )
}

const styles = StyleSheet.create({
  modalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
    marginBottom: 14,
  },
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  packageCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  packageCardPopular: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
  },
  packageBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  packageBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.6,
  },
  packageCreditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  packageCreditsText: {
    fontSize: 20,
    fontWeight: '800',
    color: CLTheme.text.primary,
  },
  packageCreditsLabel: {
    fontSize: 11,
    color: CLTheme.text.muted,
    fontWeight: '500',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.accent,
    marginTop: 2,
  },
  packagePerCredit: {
    fontSize: 10,
    color: CLTheme.text.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: CLTheme.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
})
