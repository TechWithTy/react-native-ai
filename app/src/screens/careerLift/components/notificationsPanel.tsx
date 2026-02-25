import React, { useMemo } from 'react'
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from '../theme'
import { ModalContainer } from './modalContainer'

export type NotificationTone = 'urgent' | 'non-emergent' | 'system'

export type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  tone: NotificationTone
  requiresAction?: boolean
  target?: {
    screen: string
    params?: Record<string, unknown>
  }
}

type NotificationsPanelProps = {
  visible: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onPressNotification?: (item: NotificationItem) => void
  onClearNotification?: (id: string) => void
  onClearAll?: () => void
}

const GROUPS: Array<{ label: string; tone: NotificationTone }> = [
  { label: 'Urgent', tone: 'urgent' },
  { label: 'Non-Emergent', tone: 'non-emergent' },
  { label: 'System', tone: 'system' },
]

const SWIPE_TRIGGER = 76
const MAX_SWIPE = 112

type SwipeableNotificationRowProps = {
  item: NotificationItem
  tone: NotificationTone
  canNavigate: boolean
  onPressNotification?: (item: NotificationItem) => void
  onClearNotification?: (id: string) => void
}

function SwipeableNotificationRow({
  item,
  tone,
  canNavigate,
  onPressNotification,
  onClearNotification,
}: SwipeableNotificationRowProps) {
  const translateX = React.useRef(new Animated.Value(0)).current
  const isActionable = Boolean(item.requiresAction && canNavigate)

  const resetPosition = React.useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 18,
    }).start()
  }, [translateX])

  const dismissNotification = React.useCallback(() => {
    if (!onClearNotification) {
      resetPosition()
      return
    }
    Animated.timing(translateX, {
      toValue: -MAX_SWIPE,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      onClearNotification(item.id)
      translateX.setValue(0)
    })
  }, [item.id, onClearNotification, resetPosition, translateX])

  const confirmNotification = React.useCallback(() => {
    if (!isActionable || !onPressNotification) {
      resetPosition()
      return
    }
    Animated.timing(translateX, {
      toValue: MAX_SWIPE,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      onPressNotification(item)
      onClearNotification?.(item.id)
      translateX.setValue(0)
    })
  }, [isActionable, item, onClearNotification, onPressNotification, resetPosition, translateX])

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          // If not actionable, block right-swipe (translateX > 0)
          const minX = -MAX_SWIPE
          const maxX = isActionable ? MAX_SWIPE : 0
          const clamped = Math.max(minX, Math.min(maxX, gestureState.dx))
          translateX.setValue(clamped)
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -SWIPE_TRIGGER) {
            dismissNotification()
            return
          }
          if (gestureState.dx >= SWIPE_TRIGGER && isActionable) {
            confirmNotification()
            return
          }
          resetPosition()
        },
        onPanResponderTerminate: resetPosition,
      }),
    [confirmNotification, dismissNotification, isActionable, resetPosition, translateX]
  )

  return (
    <View style={styles.notificationRow}>
      <View style={styles.swipeContainer}>
        <View style={styles.swipeBackground}>
                {/* Left Side: Confirm (visible when swiping right) */}
                {isActionable ? (
                    <Animated.View
                        style={[
                            styles.swipeAction,
                            styles.swipeConfirmAction,
                            {
                                opacity: translateX.interpolate({
                                    inputRange: [0, 16, SWIPE_TRIGGER],
                                    outputRange: [0, 1, 1],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ]}
                    >
                      <MaterialIcons name='check-circle' size={20} color='#fff' />
                      <Text style={styles.swipeActionText}>Confirm</Text>
                    </Animated.View>
                ) : (
                  <View style={styles.swipeAction} />
                )}

                <View style={styles.swipeActionSpacer} />

                {/* Right Side: Dismiss (visible when swiping left) */}
                <Animated.View
                    style={[
                        styles.swipeAction,
                        styles.swipeDismissAction,
                        {
                            opacity: translateX.interpolate({
                                inputRange: [-SWIPE_TRIGGER, -16, 0],
                                outputRange: [1, 1, 0],
                                extrapolate: 'clamp',
                            }),
                        },
                    ]}
                >
                  <MaterialIcons name='delete' size={20} color='#fff' />
                  <Text style={styles.swipeActionText}>Dismiss</Text>
                </Animated.View>
        </View>

        <Animated.View
          style={[styles.swipeCardWrap, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[styles.itemCard, toneStyles[tone], canNavigate && styles.itemCardPressable]}
            disabled={!canNavigate}
            activeOpacity={canNavigate ? 0.9 : 1}
            onPress={canNavigate ? () => onPressNotification?.(item) : undefined}
            accessibilityLabel={`Open notification ${item.title}`}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemTime}>{item.time}</Text>
            </View>
            <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
            {canNavigate && (
              <View style={styles.itemActionRow}>
                <Text style={styles.itemActionText}>
                  {isActionable ? 'Open / Swipe Right to Confirm' : 'Open'}
                </Text>
                <MaterialIcons name='arrow-forward' size={14} color={CLTheme.accent} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {onClearNotification ? (
        <TouchableOpacity
          style={styles.clearItemButton}
          onPress={() => onClearNotification(item.id)}
          accessibilityLabel={`Clear notification ${item.title}`}
        >
          <MaterialIcons name='close' size={16} color={CLTheme.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export function NotificationsPanel({
  visible,
  onClose,
  notifications,
  onPressNotification,
  onClearNotification,
  onClearAll,
}: NotificationsPanelProps) {
  const grouped = useMemo(
    () =>
      GROUPS.map(group => ({
        ...group,
        items: notifications.filter(item => item.tone === group.tone),
      })),
    [notifications]
  )

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      animationType='fade'
      backdropTestID='notifications-modal-backdrop'
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            {notifications.length > 0 && onClearAll ? (
              <TouchableOpacity onPress={onClearAll} accessibilityLabel='Clear all notifications'>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={onClose} accessibilityLabel='Close notifications'>
              <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications right now.</Text>
          ) : null}

          {grouped.map(group => (
            <View key={group.tone} style={styles.group}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.items.length === 0 ? (
                <Text style={styles.emptyText}>No {group.label.toLowerCase()} notifications.</Text>
              ) : (
                group.items.map(item => {
                  const canNavigate = Boolean(item.target && onPressNotification)
                  return (
                    <SwipeableNotificationRow
                      key={item.id}
                      item={item}
                      tone={group.tone}
                      canNavigate={canNavigate}
                      onPressNotification={onPressNotification}
                      onClearNotification={onClearNotification}
                    />
                  )
                })
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </ModalContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    maxHeight: '84%',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.accent,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 12,
    color: CLTheme.text.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  emptyText: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    paddingVertical: 6,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  swipeContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    marginVertical: 4,
  },
  swipeCardWrap: {
    borderRadius: 12,
    backgroundColor: CLTheme.card,
  },
  swipeBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  swipeActionSpacer: {
    flex: 1,
  },
  swipeAction: {
    width: MAX_SWIPE,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDismissAction: {
    backgroundColor: '#ef4444',
  },
  swipeConfirmAction: {
    backgroundColor: '#10b981',
  },
  swipeActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
    backgroundColor: CLTheme.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  itemCardPressable: {
    borderColor: `${CLTheme.accent}33`,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  itemTitle: {
    color: CLTheme.text.primary,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  itemTime: {
    color: CLTheme.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemMessage: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  itemActionRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CLTheme.border,
    paddingTop: 6,
  },
  itemActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: CLTheme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearItemButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
})

const toneStyles = StyleSheet.create({
  urgent: {
    borderColor: 'rgba(239, 68, 68, 0.55)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  'non-emergent': {
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  system: {
    borderColor: 'rgba(13, 108, 242, 0.55)',
    backgroundColor: 'rgba(13, 108, 242, 0.10)',
  },
})
