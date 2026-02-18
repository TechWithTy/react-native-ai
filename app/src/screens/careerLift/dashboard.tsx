import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useDashboardStore } from '../../store/dashboardStore'
import { CLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'

const { width } = Dimensions.get('window')

export function DashboardScreen() {
  const { pipeline, weeklyPlan, nextActions, toggleAction } = useDashboardStore()
  const { name, avatarUrl } = useUserProfileStore()
  
  const firstName = name.split(' ')[0]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: avatarUrl || 'https://i.pravatar.cc/150',
              }}
              style={styles.avatar}
            />
            <View style={styles.statusDot} />
          </View>
          <View>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.nameText}>{firstName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.newScanButton}>
            <MaterialIcons name="radar" size={16} color={CLTheme.accent} />
            <Text style={styles.newScanText}>New Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellButton}>
            <MaterialIcons name="notifications-none" size={24} color={CLTheme.text.secondary} />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Your Pipeline */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR PIPELINE</Text>
          <Text style={styles.viewAllText}>View All</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScroll}
        >
          {pipeline.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pipelineCard,
                item.tone === 'solid' && styles.offerCard, // Special style for Offers
              ]}
            >
              {item.tone === 'solid' && (
                <LinearGradient
                  colors={['#0d6cf2', '#2563ea']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    item.tone === 'primary' && { backgroundColor: 'rgba(13, 108, 242, 0.1)' },
                    item.tone === 'purple' && { backgroundColor: 'rgba(168, 85, 247, 0.1)' },
                    item.tone === 'solid' && { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  ]}
                >
                  <MaterialIcons
                    name={
                      item.label === 'Applied'
                        ? 'send'
                        : item.label === 'Interviews'
                        ? 'calendar-today'
                        : 'verified'
                    }
                    size={18}
                    color={item.tone === 'solid' ? '#fff' : item.tone === 'primary' ? CLTheme.accent : '#a855f7'}
                  />
                </View>
                {item.trend && (
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendText}>+{item.trend}</Text>
                    <MaterialIcons name="arrow-upward" size={10} color={CLTheme.status.success} />
                  </View>
                )}
                {item.tone === 'solid' && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>New!</Text>
                  </View>
                )}
              </View>

              <View>
                <Text
                  style={[
                    styles.cardValue,
                    item.tone === 'solid' && { color: '#fff' },
                  ]}
                >
                  {item.value}
                </Text>
                <Text
                  style={[
                    styles.cardLabel,
                    item.tone === 'solid' && { color: 'rgba(255, 255, 255, 0.9)' },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weekly Plan */}
        <View style={styles.weeklyPlanCard}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>Weekly Plan</Text>
            <Text style={styles.weeklyDate}>Oct 24 - 30</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.currentProgress}>{weeklyPlan.current}</Text>
            <Text style={styles.targetProgress}>/ {weeklyPlan.target} Applications</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(weeklyPlan.current / weeklyPlan.target) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.weeklyMotivation}>{`"${weeklyPlan.label}"`}</Text>
        </View>

        {/* Next Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEXT ACTIONS</Text>
          <View style={styles.actionCountBadge}>
            <Text style={styles.actionCountText}>{nextActions.length}</Text>
          </View>
        </View>

        {nextActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, action.muted && styles.mutedCard]}
            onPress={() => toggleAction(action.id)}
          >
            {action.id === '1' && <View style={styles.blueLeftBorder} />}
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, action.isCompleted && styles.checkedCheckbox]}>
                {action.isCompleted && <MaterialIcons name="check" size={14} color="#fff" />}
              </View>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <View style={styles.tagRow}>
                <View
                  style={[
                    styles.tagBadge,
                    action.tag === 'Due Today'
                      ? styles.tagRed
                      : action.tag === 'Tomorrow'
                      ? styles.tagOrange
                      : styles.tagGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      action.tag === 'Due Today'
                        ? { color: CLTheme.status.danger }
                        : action.tag === 'Tomorrow'
                        ? { color: CLTheme.status.warning }
                        : { color: CLTheme.text.muted },
                    ]}
                  >
                    {action.tag}
                  </Text>
                </View>
                {action.id === '1' && (
                 <Text style={styles.subTagText}>Software Engineer Role</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: CLTheme.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: CLTheme.card,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CLTheme.status.success,
    borderWidth: 2,
    borderColor: CLTheme.background,
  },
  greetingText: {
    fontSize: 12,
    color: CLTheme.text.muted,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 108, 242, 0.15)', // slightly more visibility on dark
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  newScanText: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  bellButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CLTheme.status.danger,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12, // slightly smaller caption style
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontSize: 12,
    color: CLTheme.accent,
    fontWeight: '500',
  },
  pipelineScroll: {
    paddingBottom: 4,
    gap: 12,
  },
  pipelineCard: {
    width: 140,
    height: 128,
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: CLTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  offerCard: {
    backgroundColor: CLTheme.accent,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.status.success,
  },
  newBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardValue: {
    fontSize: 30,
    fontWeight: '700',
    color: CLTheme.text.primary,
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: CLTheme.text.secondary,
    zIndex: 1,
  },
  weeklyPlanCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: CLTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  weeklyDate: {
    fontSize: 12,
    fontWeight: '500',
    color: CLTheme.text.muted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 4,
  },
  currentProgress: {
    fontSize: 24,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  targetProgress: {
    fontSize: 14,
    color: CLTheme.text.secondary,
    paddingBottom: 4,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: CLTheme.border, // Darker track
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: CLTheme.accent,
    borderRadius: 5,
  },
  weeklyMotivation: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    fontStyle: 'italic',
  },
  actionCountBadge: {
    backgroundColor: CLTheme.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: CLTheme.text.secondary,
  },
  actionCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    gap: 16,
  },
  blueLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: CLTheme.accent,
  },
  mutedCard: {
    opacity: 0.5,
  },
  checkboxContainer: {
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: CLTheme.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: CLTheme.accent,
    borderColor: CLTheme.accent,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.primary,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  tagOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  tagGray: {
    backgroundColor: CLTheme.border,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  subTagText: {
    fontSize: 10,
    color: CLTheme.text.muted,
  },
  fab: {
    position: 'absolute',
    bottom: 24, // above navbar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
})
