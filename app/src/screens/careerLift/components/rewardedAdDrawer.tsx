import React from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from '../theme'
import { useCreditsStore } from '../../../store/creditsStore'
import { ModalContainer } from './modalContainer'

type RewardedAdMode = 'ai_credits' | 'scan_credits'

type RewardedAdDrawerProps = {
  visible: boolean
  onClose: () => void
  mode: RewardedAdMode
  rewardAmount?: number
  onRewardGranted?: () => void
}

const DEFAULT_REWARD_BY_MODE: Record<RewardedAdMode, number> = {
  ai_credits: 12,
  scan_credits: 2,
}

export function RewardedAdDrawer({
  visible,
  onClose,
  mode,
  rewardAmount,
  onRewardGranted,
}: RewardedAdDrawerProps) {
  const addCredits = useCreditsStore(state => state.addCredits)
  const addScanCredits = useCreditsStore(state => state.addScanCredits)
  const [watching, setWatching] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const reward = rewardAmount ?? DEFAULT_REWARD_BY_MODE[mode]
  const title = mode === 'ai_credits' ? 'Out of AI Credits' : 'Out of Scan Credits'
  const rewardLabel = mode === 'ai_credits' ? `${reward} AI credits` : `${reward} scan credits`

  React.useEffect(() => {
    if (!visible) {
      setWatching(false)
      setProgress(0)
    }
  }, [visible])

  React.useEffect(() => {
    if (!watching) return
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 0.2, 1)
        if (next >= 1) {
          clearInterval(timer)
          setWatching(false)
          if (mode === 'ai_credits') {
            addCredits(reward)
          } else {
            addScanCredits(reward, `Rewarded ad bonus: ${reward} scan credits`)
          }
          onClose()
          onRewardGranted?.()
          Alert.alert('Reward added', `You earned ${rewardLabel}.`)
        }
        return next
      })
    }, 650)

    return () => clearInterval(timer)
  }, [watching, mode, reward, rewardLabel, addCredits, addScanCredits, onClose, onRewardGranted])

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      animationType='fade'
      backdropTestID={mode === 'ai_credits' ? 'rewarded-ad-ai-backdrop' : 'rewarded-ad-scan-backdrop'}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} disabled={watching}>
            <MaterialIcons name='close' size={22} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Watch a short ad to unlock {rewardLabel} and continue.
        </Text>

        <View style={styles.rewardRow}>
          <View style={styles.rewardIcon}>
            <Feather name={mode === 'ai_credits' ? 'zap' : 'target'} size={16} color={CLTheme.accent} />
          </View>
          <Text style={styles.rewardText}>Reward: {rewardLabel}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {watching ? (
          <View style={styles.watchingState}>
            <ActivityIndicator color={CLTheme.accent} />
            <Text style={styles.watchingText}>Watching ad... {Math.round(progress * 100)}%</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setProgress(0)
                setWatching(true)
              }}
              testID={mode === 'ai_credits' ? 'watch-ad-ai-button' : 'watch-ad-scan-button'}
            >
              <MaterialIcons name='play-circle-filled' size={16} color='#fff' />
              <Text style={styles.primaryBtnText}>Watch Ad</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ModalContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: CLTheme.text.secondary,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
  },
  rewardText: {
    fontSize: 13,
    color: CLTheme.text.primary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CLTheme.accent,
  },
  watchingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  watchingText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  secondaryBtnText: {
    color: CLTheme.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    paddingVertical: 11,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
})
