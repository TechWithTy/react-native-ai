import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  NotificationChannel,
  NotificationPreferenceKey,
  useUserProfileStore,
} from '../../store/userProfileStore'
import { CLTheme } from './theme'

type NotificationSetting = {
  key: NotificationPreferenceKey
  title: string
  subtitle: string
  lockEmail?: boolean
  disableSms?: boolean
}

type NotificationGroup = {
  title: string
  settings: NotificationSetting[]
}

const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    title: 'Job Search & Applications',
    settings: [
      {
        key: 'newScanReady',
        title: 'New Scan Ready',
        subtitle: 'Alerts when scans finish and new job matches are ready.',
      },
      {
        key: 'applicationStatus',
        title: 'Application Status',
        subtitle: 'Updates on submitted applications and recruiter responses.',
      },
      {
        key: 'savedJobFilters',
        title: 'Saved Job Filters',
        subtitle: 'New jobs matching your saved search criteria.',
      },
    ],
  },
  {
    title: 'Interviews & Follow-ups',
    settings: [
      {
        key: 'interviewReminders',
        title: 'Interview Reminders',
        subtitle: 'Reminders before scheduled interview sessions.',
      },
      {
        key: 'followUpAlerts',
        title: 'Follow-up Alerts',
        subtitle: 'Prompts to send thank-you notes and check-ins.',
      },
    ],
  },
  {
    title: 'Platform',
    settings: [
      {
        key: 'weeklyDigest',
        title: 'Weekly Digest',
        subtitle: 'Summary of market trends and weekly progress.',
        disableSms: true,
      },
      {
        key: 'securityAlerts',
        title: 'Security Alerts',
        subtitle: 'Login attempts and password reset activity.',
        lockEmail: true,
      },
    ],
  },
]

export function NotificationsPreferencesScreen() {
  const navigation = useNavigation<any>()
  const {
    notificationPhoneNumber,
    notificationPhoneVerified,
    pauseAllNotifications,
    notificationPreferences,
    setPauseAllNotifications,
    setNotificationChannel,
  } = useUserProfileStore()

  const handleToggleChannel = (
    setting: NotificationSetting,
    channel: NotificationChannel,
    value: boolean
  ) => {
    if (setting.lockEmail && channel === 'email') return
    if (setting.disableSms && channel === 'sms') return
    setNotificationChannel(setting.key, channel, value)
  }

  const renderChannelSwitch = (setting: NotificationSetting, channel: NotificationChannel) => {
    const disabledByRule = (setting.lockEmail && channel === 'email') || (setting.disableSms && channel === 'sms')
    const disabled = pauseAllNotifications || disabledByRule
    const value = setting.lockEmail && channel === 'email' ? true : notificationPreferences[setting.key][channel]

    return (
        <View style={[styles.channelCell, disabledByRule && styles.channelCellDisabled]}>
        <Switch
          value={value}
          onValueChange={(nextValue) => handleToggleChannel(setting, channel, nextValue)}
          disabled={disabled}
          testID={`pref-${setting.key}-${channel}-toggle`}
          thumbColor='#fff'
          trackColor={{ false: '#334155', true: CLTheme.accent }}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='arrow-back' size={22} color={CLTheme.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, styles.phoneIconBg]}>
                  <MaterialIcons name='smartphone' size={18} color={CLTheme.accent} />
                </View>
                <View>
                  <Text style={styles.phoneText}>{notificationPhoneNumber}</Text>
                  <View style={styles.verifiedRow}>
                    <MaterialIcons name='check-circle' size={14} color={CLTheme.status.success} />
                    <Text style={styles.verifiedText}>
                      {notificationPhoneVerified ? 'Verified' : 'Unverified'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => navigation.navigate('AccountSecurity')}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            <View style={styles.pauseRow}>
              <View>
                <Text style={styles.rowLabel}>Pause All Notifications</Text>
                <Text style={styles.rowHint}>Temporarily disable all alerts.</Text>
              </View>
              <Switch
                value={pauseAllNotifications}
                onValueChange={setPauseAllNotifications}
                testID='pause-all-notifications-toggle'
                thumbColor='#fff'
                trackColor={{ false: '#334155', true: CLTheme.accent }}
              />
            </View>
          </View>
        </View>

        <View style={styles.columnsHeader}>
          <Text style={styles.columnsTitle}>Settings</Text>
          <Text style={styles.columnLabel}>Email</Text>
          <Text style={styles.columnLabel}>SMS</Text>
          <Text style={styles.columnLabel}>Push</Text>
        </View>

        {NOTIFICATION_GROUPS.map(group => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.settings.map((setting, index) => (
                <View key={setting.key}>
                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceTextWrap}>
                      <Text style={styles.preferenceTitle}>{setting.title}</Text>
                      <Text style={styles.preferenceSubtitle}>{setting.subtitle}</Text>
                    </View>
                    {renderChannelSwitch(setting, 'email')}
                    {renderChannelSwitch(setting, 'sms')}
                    {renderChannelSwitch(setting, 'push')}
                  </View>
                  {index < group.settings.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footerHint}>
          Security alerts via email stay enabled to keep your account protected.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: CLTheme.text.muted,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: CLTheme.accent,
    marginBottom: 8,
  },
  card: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIconBg: {
    backgroundColor: 'rgba(13, 108, 242, 0.18)',
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  verifiedRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: CLTheme.status.success,
    fontWeight: '600',
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.accent,
  },
  separator: {
    height: 1,
    backgroundColor: CLTheme.border,
    marginLeft: 14,
  },
  pauseRow: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  rowHint: {
    fontSize: 12,
    color: CLTheme.text.muted,
    marginTop: 2,
  },
  columnsHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  columnsTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: CLTheme.text.muted,
  },
  columnLabel: {
    width: 52,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: CLTheme.text.muted,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  preferenceTextWrap: {
    flex: 1,
    paddingRight: 2,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  preferenceSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: CLTheme.text.muted,
  },
  channelCell: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelCellDisabled: {
    opacity: 0.6,
  },
  footerHint: {
    marginTop: 4,
    fontSize: 11,
    color: CLTheme.text.muted,
    paddingHorizontal: 2,
  },
})
