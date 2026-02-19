import * as React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Modal,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { CLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'
import { JobEntry, useJobTrackerStore } from '../../store/jobTrackerStore'
import { NotificationItem, NotificationsPanel } from './components/notificationsPanel'
import { careerLiftNotifications } from './notificationsData'

const { width } = Dimensions.get('window')

type WeeklyActionItem = {
  id: string
  title: string
  subtitle: string
  type: 'action' | 'generic'
  job?: JobEntry
}

export function WeeklyDigestScreen() {
  const navigation = useNavigation<any>()
  const user = useUserProfileStore(state => state)
  const { thisWeek, nextUp, updateJobStatus, updateJobAction } = useJobTrackerStore(state => state)

  // Calendar State
  const [showCalendar, setShowCalendar] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(() => [...careerLiftNotifications])
  const [completedActions, setCompletedActions] = React.useState<WeeklyActionItem[]>([])

  // Calculate week range
  const weekRange = React.useMemo(() => {
    const date = new Date(selectedDate)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(date.setDate(diff))
    const sunday = new Date(date.setDate(monday.getDate() + 6))

    const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${format(monday)} - ${format(sunday)}`
  }, [selectedDate])

  // Derived Metrics
  const metrics = React.useMemo(() => {
    const allJobs = [...thisWeek, ...nextUp]
    const applied = allJobs.filter(j => j.status === 'Applied').length
    const interviews = allJobs.filter(j => j.status === 'Interview' || j.status === 'Interviewing').length
    const offers = allJobs.filter(j => j.status === 'Offer Received' || j.status === 'Offer Signed').length
    
    // Mocking outreach data for now as we don't track it explicitly yet
    const outreach = 25 
    const outreachTarget = 30

    return { applied, interviews, offers, outreach, outreachTarget }
  }, [thisWeek, nextUp])

  // Get next week's scheduled actions
  const nextActions = React.useMemo(() => {
    return nextUp
      .filter(job => job.nextAction)
      .slice(0, 3)
      .map(job => ({
        id: job.id,
        title: job.nextAction,
        subtitle: `${job.role} at ${job.company}`,
        type: 'action' as const,
        job,
      }))
  }, [nextUp])

  // Fallback actions if no scheduled items
  const displayActions: WeeklyActionItem[] = nextActions.length > 0 ? nextActions : [
    { id: 'a1', title: 'Boost Outreach Volume', subtitle: 'Aim for 5 more cold emails to improve top-of-funnel.', type: 'generic' },
    { id: 'a2', title: 'Interview Follow-up', subtitle: 'Follow up with TechCorp regarding your interview.', type: 'generic' },
    { id: 'a3', title: 'Portfolio Maintenance', subtitle: 'Update portfolio link on LinkedIn profile.', type: 'generic' },
  ]

  const handleCheckAction = (action: WeeklyActionItem) => {
    // Add to completed list first
    setCompletedActions(prev => [...prev, action])

    if (action.type === 'generic') return
    
    if (action.job) {
      const title = action.title.toLowerCase()
      const job = action.job
      
      // Delay store update slightly to allow animation if we added one, 
      // but for now just update state immediately
      if (title.includes('submit') || title.includes('apply')) {
        updateJobStatus(job.id, 'Applied')
        updateJobAction(job.id, 'Follow up', 'in 3 days')
      } else if (title.includes('interview')) {
        updateJobAction(job.id, 'Send Thank You', 'Tomorrow')
      } else if (title.includes('offer')) {
        updateJobStatus(job.id, 'Offer Signed')
        updateJobAction(job.id, 'Prepare for onboarding', 'Next Week')
      } else {
        updateJobAction(job.id, '', '') 
      }
    }
  }

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.target) return
    setShowNotifications(false)
    navigation.navigate(item.target.screen, item.target.params)
  }

  const handleClearNotification = (id: string) => {
    setNotifications(current => current.filter(item => item.id !== id))
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  const resolveActionTarget = (action: WeeklyActionItem) => {
    const normalizedTitle = action.title.toLowerCase()

    if (normalizedTitle.includes('submit application') || normalizedTitle.includes('apply')) {
      if (action.job) {
        return { screen: 'ApplyPack', params: { job: action.job } }
      }
      return { screen: 'JobTracker', params: { openAddJobModal: true } }
    }

    if (
      normalizedTitle.includes('follow') ||
      normalizedTitle.includes('outreach') ||
      normalizedTitle.includes('recruiter') ||
      normalizedTitle.includes('coffee chat')
    ) {
      if (action.job) {
        return { screen: 'OutreachCenter', params: { job: action.job } }
      }
      return { screen: 'OutreachCenter' }
    }

    if (normalizedTitle.includes('interview') || normalizedTitle.includes('screen')) {
      if (action.job) {
        return { screen: 'InterviewPrep', params: { job: action.job } }
      }
      return { screen: 'InterviewPrep' }
    }

    if (normalizedTitle.includes('offer') || normalizedTitle.includes('sign')) {
      if (action.job) {
        return { screen: 'ApplyPack', params: { job: action.job } }
      }
      return { screen: 'ApplyPack' }
    }

    if (normalizedTitle.includes('portfolio') || normalizedTitle.includes('linkedin')) {
      return { screen: 'LinkedInKit' }
    }

    return { screen: 'JobTracker' }
  }

  const handlePlanActionPress = (action: WeeklyActionItem) => {
    const target = resolveActionTarget(action)
    navigation.navigate(target.screen, target.params)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={18} color={CLTheme.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>WEEKLY DIGEST</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowCalendar(true)}>
              <Text style={styles.dateText}>{weekRange}</Text>
              <MaterialIcons name="expand-more" size={16} color={CLTheme.accent} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowNotifications(true)}
            accessibilityLabel='Open notifications'
          >
            <MaterialIcons name="notifications-none" size={24} color={CLTheme.text.secondary} />
            {notifications.length > 0 ? <View style={styles.notificationBadge} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View style={styles.section}>
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTitle}>Great hustle, {user.name.split(' ')[0]}! 🔥</Text>
              <Text style={styles.greetingSubtitle}>You're in the top 10% of active users this week.</Text>
            </View>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGradient}>
                 <Image source={{ uri: user.avatarUrl || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
              </View>
            </View>
          </View>
        </View>

        {/* Proof of Work Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PROOF OF WORK</Text>
          <View style={styles.grid}>
            {/* Applications Card */}
            <View style={styles.card}>
              <View style={styles.cardIconDecor}>
                <MaterialIcons name="send" size={40} color={CLTheme.accent} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: 'rgba(13, 108, 242, 0.1)' }]}>
                    <MaterialIcons name="description" size={16} color={CLTheme.accent} />
                  </View>
                  <Text style={styles.cardLabel}>Applications</Text>
                </View>
                <View>
                  <Text style={styles.statValue}>{metrics.applied || 12}</Text>
                  <View style={styles.trendRow}>
                    <MaterialIcons name="trending-up" size={14} color="#10b981" />
                    <Text style={styles.trendText}>+20% vs last week</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Outreach Card */}
            <View style={styles.card}>
              <View style={styles.cardIconDecor}>
                <MaterialIcons name="campaign" size={40} color="#a855f7" />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                    <MaterialIcons name="mail" size={16} color="#a855f7" />
                  </View>
                  <Text style={styles.cardLabel}>Outreach</Text>
                </View>
                <View>
                  <Text style={styles.statValue}>{metrics.outreach}</Text>
                  <View style={styles.trendRow}>
                    <Text style={[styles.trendText, { color: CLTheme.text.secondary }]}>Target: {metrics.outreachTarget}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Interviews Full Width Card */}
            <LinearGradient
              colors={[CLTheme.accent, '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fullCard}
            >
              <View style={styles.cardOverlay} />
              <View style={styles.fullCardContent}>
                <View style={styles.fullCardHeader}>
                  <View style={styles.glassBadge}>
                    <MaterialIcons name="videocam" size={16} color="#fff" />
                  </View>
                  <Text style={styles.fullCardLabel}>Interviews Attended</Text>
                </View>
                <Text style={styles.fullCardSubtext}>Scheduled for next week: 1</Text>
              </View>
              <Text style={styles.fullCardValue}>{metrics.interviews || 2}</Text>
              <View style={styles.trophyIcon}>
                 <MaterialIcons name="emoji-events" size={28} color="#fff" />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Conversion Funnel */}
        <View style={styles.section}>
          <View style={styles.funnelHeader}>
            <Text style={styles.sectionHeader}>CONVERSION FUNNEL</Text>
            <View style={styles.topRateBadge}>
              <Text style={styles.topRateText}>Top 10% Rate</Text>
            </View>
          </View>
          
          <View style={styles.funnelContainer}>
            <View style={styles.connectorLine} />
            
            {/* Applications Stage */}
            <FunnelStage 
              label="Applications" 
              count={`${metrics.applied || 12} total`} 
              percent="100%" 
              color={CLTheme.text.secondary}
              fillColor={CLTheme.text.secondary}
              fillPercent="100%"
              iconColor="#64748b"
            />

            {/* Interviews Stage */}
            <FunnelStage 
              label="Interviews" 
              count={`${metrics.interviews || 2} total`} 
              percent="16%" 
              color={CLTheme.accent}
              fillColor={CLTheme.accent}
              fillPercent="16%"
              isActive
            />

            {/* Offers Stage */}
            <FunnelStage 
              label="Offers" 
              count="Pending" 
              percent="--" 
              color="#10b981"
              fillColor="#10b981"
              fillPercent="0%"
              isLast
              opacity={0.6}
            />
          </View>
        </View>

        {/* Next Week's Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>NEXT WEEK'S PLAN</Text>
          <View style={styles.planList}>
            {displayActions
              .filter(a => !completedActions.some(ca => ca.id === a.id)) // Hide if in completed
              .map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.planItem}
                activeOpacity={0.7}
                onPress={() => handlePlanActionPress(action)}
                accessibilityLabel={`Open action ${action.title}`}
              >
                <TouchableOpacity 
                  style={styles.checkboxWrapper}
                  onPress={() => handleCheckAction(action)}
                >
                  <View style={styles.checkbox} />
                </TouchableOpacity>
                <View style={styles.planContent}>
                  <Text style={styles.planTitle}>{action.title}</Text>
                  <Text style={styles.planSubtitle}>{action.subtitle}</Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={14} color={CLTheme.text.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionHeader, { marginBottom: 12 }]}>COMPLETED</Text>
              <View style={styles.planList}>
                {completedActions.map((action, idx) => (
                  <View key={`${action.id}-completed-${idx}`} style={[styles.planItem, { opacity: 0.6 }]}>
                    <View style={[styles.checkboxWrapper, { backgroundColor: CLTheme.accent, borderColor: CLTheme.accent }]}>
                      <MaterialIcons name="check" size={12} color="#fff" />
                    </View>
                    <View style={styles.planContent}>
                      <Text style={[styles.planTitle, { textDecorationLine: 'line-through', color: CLTheme.text.muted }]}>
                        {action.title}
                      </Text>
                      <Text style={styles.planSubtitle}>{action.subtitle}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Nav */}
      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate}
              onDayPress={(day: { dateString: string }) => {
                setSelectedDate(day.dateString)
                setShowCalendar(false)
              }}
              theme={{
                backgroundColor: CLTheme.card,
                calendarBackground: CLTheme.card,
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: CLTheme.accent,
                selectedDayTextColor: '#ffffff',
                todayTextColor: CLTheme.accent,
                dayTextColor: '#fff',
                textDisabledColor: '#475569',
                dotColor: CLTheme.accent,
                selectedDotColor: '#ffffff',
                arrowColor: CLTheme.accent,
                monthTextColor: '#fff',
                indicatorColor: CLTheme.accent,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onPressNotification={handleNotificationPress}
        onClearNotification={handleClearNotification}
        onClearAll={handleClearAllNotifications}
      />
    </View>
  )
}

function FunnelStage({ label, count, percent, color, fillColor, fillPercent, isActive, isLast, opacity, iconColor }: any) {
  return (
    <View style={[styles.funnelRow, opacity ? { opacity } : null]}>
      <View style={[styles.funnelCircle, isActive ? { backgroundColor: 'rgba(13, 108, 242, 0.1)' } : null]}>
        <Text style={[styles.funnelPercent, { color: iconColor || color }]}>{percent}</Text>
      </View>
      <View style={styles.funnelContent}>
        <View style={styles.funnelTextRow}>
          <Text style={styles.funnelLabel}>{label}</Text>
          <Text style={styles.funnelCount}>{count}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: fillPercent, backgroundColor: fillColor },
              isActive ? styles.glowShadow : null
            ]} 
          />
        </View>
      </View>
    </View>
  )
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: 'rgba(16, 23, 34, 0.8)', // bg-dark/80
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    zIndex: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: CLTheme.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: CLTheme.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: CLTheme.text.secondary,
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: CLTheme.accent, // simple gradient fallback
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: CLTheme.background,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: (width - 44) / 2,
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    position: 'relative',
    overflow: 'hidden',
    height: 140,
  },
  cardIconDecor: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    padding: 6,
    borderRadius: 8,
  },
  cardLabel: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '500',
  },
  fullCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 128,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ skewX: '12deg' }, { translateX: 32 }]
  },
  fullCardContent: {
    flex: 1,
    zIndex: 10,
  },
  fullCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  glassBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 6,
  },
  fullCardLabel: {
    color: '#dbeafe', // blue-100
    fontSize: 12,
    fontWeight: '500',
  },
  // fullCardStats removed
  fullCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginRight: 16,
  },
  fullCardSubtext: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.9,
  },
  trophyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  // Funnel
  funnelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topRateBadge: {
    backgroundColor: CLTheme.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  topRateText: {
    color: CLTheme.text.secondary,
    fontSize: 10,
    fontWeight: '500',
  },
  funnelContainer: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: CLTheme.border,
    paddingLeft: 10,
    position: 'relative',
    gap: 16,
  },
  connectorLine: {
    position: 'absolute',
    left: 33, // Half of icon width (48/2 = 24) + paddingLeft (10) - half line width (1) ~= 33
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: CLTheme.border,
    zIndex: 0,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  funnelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CLTheme.background,
    borderWidth: 4,
    borderColor: CLTheme.card, // Should match container bg to look like "cutout"
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  funnelPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  funnelContent: {
    flex: 1,
  },
  funnelTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  funnelLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  funnelCount: {
    color: CLTheme.text.muted,
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: CLTheme.background, // darker track
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  glowShadow: {
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  // Plan List
  planList: {
    gap: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
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
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  planSubtitle: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 10,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
})
