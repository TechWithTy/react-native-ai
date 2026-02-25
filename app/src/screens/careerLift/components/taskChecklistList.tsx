import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useCLTheme, CLThemeTokens } from '../theme'
import { WeeklyActionItem } from './useTaskChecklistFlow'

type TaskChecklistListProps = {
  activeActions: WeeklyActionItem[]
  completedActions: WeeklyActionItem[]
  onOpenAction: (action: WeeklyActionItem) => void
  onCheckAction: (action: WeeklyActionItem) => void
  onUncheckAction: (action: WeeklyActionItem) => void
}

export function TaskChecklistList({
  activeActions,
  completedActions,
  onOpenAction,
  onCheckAction,
  onUncheckAction,
}: TaskChecklistListProps) {
  const theme = useCLTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.planList}>
      {activeActions.map(action => (
        <TouchableOpacity
          key={`active-${action.id}-${action.title}`}
          style={styles.planItem}
          activeOpacity={0.7}
          onPress={() => onOpenAction(action)}
          accessibilityLabel={`Open action ${action.title}`}
        >
          <TouchableOpacity
            style={styles.checkboxWrapper}
            onPress={() => onCheckAction(action)}
            accessibilityLabel={`Mark action ${action.title} done`}
          >
            <View style={styles.checkbox} />
          </TouchableOpacity>
          <View style={styles.planContent}>
            <Text style={styles.planTitle}>{action.title}</Text>
            <Text style={styles.planSubtitle}>{action.subtitle}</Text>
          </View>
          <MaterialIcons name='arrow-forward-ios' size={14} color={theme.text.muted} />
        </TouchableOpacity>
      ))}

      {completedActions.length > 0 && (
        <View style={styles.completedSection}>
          <Text style={styles.completedTitle}>COMPLETED</Text>
          <View style={styles.planList}>
            {completedActions.map(action => (
              <View key={`completed-${action.id}-${action.title}`} style={[styles.planItem, { opacity: 0.6 }]}>
                <TouchableOpacity
                  style={[styles.checkbox, styles.checkedCheckbox]}
                  onPress={() => onUncheckAction(action)}
                  accessibilityLabel={`Uncheck action ${action.title}`}
                >
                  <MaterialIcons name='check' size={12} color='#fff' />
                </TouchableOpacity>
                <View style={styles.planContent}>
                  <Text style={[styles.planTitle, styles.completedPlanTitle]}>{action.title}</Text>
                  <Text style={styles.planSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const getStyles = (t: CLThemeTokens) =>
  StyleSheet.create({
    planList: {
      gap: 12,
    },
    planItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 12,
      backgroundColor: t.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    checkboxWrapper: {
      marginTop: 2,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: 'rgba(13, 108, 242, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkedCheckbox: {
      backgroundColor: t.accent,
      borderColor: t.accent,
    },
    planContent: {
      flex: 1,
    },
    planTitle: {
      color: t.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    completedPlanTitle: {
      textDecorationLine: 'line-through',
      color: t.text.muted,
    },
    planSubtitle: {
      color: t.text.secondary,
      fontSize: 12,
      marginTop: 2,
    },
    completedSection: {
      marginTop: 12,
    },
    completedTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: t.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
  })

