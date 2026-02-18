import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
}

type NotificationsPanelProps = {
  visible: boolean
  onClose: () => void
  notifications: NotificationItem[]
}

const GROUPS: Array<{ label: string; tone: NotificationTone }> = [
  { label: 'Urgent', tone: 'urgent' },
  { label: 'Non-Emergent', tone: 'non-emergent' },
  { label: 'System', tone: 'system' },
]

export function NotificationsPanel({
  visible,
  onClose,
  notifications,
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
          <TouchableOpacity onPress={onClose} accessibilityLabel='Close notifications'>
            <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {grouped.map(group => (
            <View key={group.tone} style={styles.group}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.items.length === 0 ? (
                <Text style={styles.emptyText}>No {group.label.toLowerCase()} notifications.</Text>
              ) : (
                group.items.map(item => (
                  <View key={item.id} style={[styles.itemCard, toneStyles[group.tone]]}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                  </View>
                ))
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
  itemCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6,
    backgroundColor: CLTheme.background,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    color: CLTheme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  itemTime: {
    color: CLTheme.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  itemMessage: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    lineHeight: 17,
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
