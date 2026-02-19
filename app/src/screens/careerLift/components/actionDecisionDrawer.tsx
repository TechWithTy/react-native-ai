import React from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { CLTheme } from '../theme'

type ActionDecisionDrawerProps = {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  denyLabel: string
  onConfirm: () => void
  onDeny: () => void
  onClose: () => void
}

export function ActionDecisionDrawer({
  visible,
  title,
  message,
  confirmLabel,
  denyLabel,
  onConfirm,
  onDeny,
  onClose,
}: ActionDecisionDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet} testID='action-decision-drawer'>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.denyButton]}
              onPress={onDeny}
              testID='action-decision-deny'
              accessibilityLabel={denyLabel}
            >
              <Text style={styles.actionButtonText}>{denyLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={onConfirm}
              testID='action-decision-confirm'
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.actionButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: CLTheme.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: CLTheme.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: CLTheme.border,
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  message: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    color: CLTheme.text.secondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyButton: {
    backgroundColor: CLTheme.status.danger,
  },
  confirmButton: {
    backgroundColor: CLTheme.status.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
})
