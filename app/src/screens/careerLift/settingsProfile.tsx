import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native'
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons'
import { CLTheme } from './theme'
import { useCareerSetupStore } from '../../store/careerSetup'
import { useUserProfileStore } from '../../store/userProfileStore'

export function SettingsProfileScreen() {
  const [calendarSync, setCalendarSync] = useState(true)
  const { 
    targetRole, 
    roleTrack, 
    seniority, 
    locationPreference 
  } = useCareerSetupStore()
  
  const { 
    name, 
    avatarUrl, 
    currentLocation, 
    isOpenToWork 
  } = useUserProfileStore()

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Navigate to edit profile screen')
  }

  const handleManageSubscription = () => {
    Alert.alert('Manage Subscription', 'Navigate to subscription settings')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Deleted') },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl || 'https://i.pravatar.cc/150' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.roleText}>{targetRole || 'Software Engineer'}</Text>

          <View style={styles.pillRow}>
            {isOpenToWork && (
              <View style={[styles.pill, styles.pillBlue]}>
                <Text style={styles.pillTextBlue}>Open to Work</Text>
              </View>
            )}
            <View style={[styles.pill, styles.pillGray]}>
              <Text style={styles.pillTextGray}>{currentLocation}</Text>
            </View>
          </View>
        </View>

        {/* Section: Target Role Track */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TARGET ROLE TRACK</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="trending-up" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Seniority Level</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{seniority || 'Mid-Level'}</Text>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.separator} />

            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="work-outline" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Role Preferences</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{roleTrack || 'Engineering'}</Text>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Integrations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTEGRATIONS</Text>
          <View style={styles.card}>
            {/* LinkedIn */}
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 102, 194, 0.15)' }]}>
                  <FontAwesome5 name="linkedin-in" size={18} color="#0a66c2" />
                </View>
                <Text style={styles.rowLabel}>LinkedIn</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Connected</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Gmail */}
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 67, 53, 0.15)' }]}>
                  <MaterialIcons name="mail-outline" size={20} color="#ea4335" />
                </View>
                <Text style={styles.rowLabel}>Gmail</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Connected</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.separator} />

            {/* Outlook */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 120, 212, 0.15)' }]}>
                  <Ionicons name="mail-open-outline" size={20} color="#0078d4" />
                </View>
                <Text style={styles.rowLabel}>Outlook</Text>
              </View>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* Calendar Sync */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialIcons name="event" size={20} color="#f59e0b" />
                </View>
                <Text style={styles.rowLabel}>Calendar Sync</Text>
              </View>
              <Switch
                value={calendarSync}
                onValueChange={setCalendarSync}
                trackColor={{ false: CLTheme.border, true: CLTheme.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>
          <Text style={styles.helperText}>
            Syncing allows Career Lift to detect interview invites automatically.
          </Text>
        </View>

        {/* Section: Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILLING</Text>
          <View style={[styles.card, { padding: 16 }]}>
            <View style={styles.planRow}>
              <View style={styles.planLeft}>
                <View style={[styles.iconBoxLarge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <MaterialIcons name="diamond" size={24} color="#a855f7" />
                </View>
                <View>
                  <Text style={styles.planTitle}>Current Plan</Text>
                  <Text style={styles.planSubtitle}>Renews on Oct 24, 2023</Text>
                </View>
              </View>
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Privacy & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & DATA</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: CLTheme.border }]}>
                  <MaterialIcons name="download" size={20} color={CLTheme.text.secondary} />
                </View>
                <Text style={styles.rowLabel}>Export Activity Log (CSV)</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <MaterialIcons name="delete-outline" size={20} color={CLTheme.status.danger} />
                </View>
                <Text style={[styles.rowLabel, { color: CLTheme.status.danger }]}>Delete Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Career Lift v2.4.1 (Build 890)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: CLTheme.card,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CLTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CLTheme.background,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: CLTheme.text.primary,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: CLTheme.text.secondary,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillBlue: {
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    borderColor: 'rgba(13, 108, 242, 0.3)',
  },
  pillGray: {
    backgroundColor: CLTheme.border,
    borderColor: CLTheme.border,
  },
  pillTextBlue: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  pillTextGray: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 108, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  rowValue: {
    fontSize: 14,
    color: CLTheme.text.secondary,
  },
  separator: {
    height: 1,
    backgroundColor: CLTheme.border,
    marginLeft: 60, // visual offset
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: CLTheme.status.success,
  },
  connectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  helperText: {
    fontSize: 12,
    color: CLTheme.text.muted,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBoxLarge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  planSubtitle: {
    fontSize: 12,
    color: CLTheme.text.muted,
  },
  proBadge: {
    backgroundColor: '#d8b4fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  proText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b21a8',
  },
  manageButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CLTheme.border, // Using border color for subtlety, or accent
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  versionText: {
    textAlign: 'center',
    color: CLTheme.text.muted,
    fontSize: 12,
    marginTop: 20,
    opacity: 0.5,
  },
})
