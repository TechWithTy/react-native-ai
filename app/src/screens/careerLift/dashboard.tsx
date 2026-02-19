import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { useDashboardStore } from '../../store/dashboardStore'
import { JobEntry, useJobTrackerStore } from '../../store/jobTrackerStore'
import { CLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'
import { NotificationItem, NotificationsPanel } from './components/notificationsPanel'
import { ModalContainer } from './components/modalContainer'
import { useCareerSetupStore } from '../../store/careerSetup'
import { useCreditsStore } from '../../store/creditsStore'
import { careerLiftNotifications } from './notificationsData'
import { CustomPrepEntryModal } from './components/customPrepEntryModal'

type DashboardProps = {
  navigation?: {
    navigate?: (screen: string, params?: Record<string, unknown>) => void
    setParams?: (params: Record<string, unknown>) => void
  }
  route?: {
    params?: {
      startScanFromSavedFilters?: boolean
    }
  }
}

type QuickAction = {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof MaterialIcons.glyphMap
  iconColor: string
  iconBg: string
  onPress: () => void
}

const RESUME_SCAN_STEPS = [
  'Uploading resume source',
  'Extracting ATS keywords',
  'Scoring job-fit alignment',
  'Preparing scan report',
]

const SUPPORTED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const ROLE_HINT_REGEX = /\b((?:senior|staff|lead|principal|junior|head|sr|jr)\s+)?([a-z][a-z/&+\- ]{1,50}?(?:engineer|designer|manager|researcher|developer|scientist|analyst|architect|consultant))\b/i

const normalizeSpace = (value: string) => value.replace(/\s+/g, ' ').trim()

const toTitleCase = (value: string) =>
  normalizeSpace(value)
    .replace(/\bsr\b/gi, 'Senior')
    .replace(/\bjr\b/gi, 'Junior')
    .split(' ')
    .filter(Boolean)
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ')

const cleanRole = (value: string) =>
  normalizeSpace(value)
    .replace(/^(job title|title|role|position)\s*[:\-]\s*/i, '')
    .replace(/\s*\|\s*.+$/, '')
    .replace(/[^\w\s/&+\-.]/g, '')

const inferRoleFromUrl = (source: string) => {
  try {
    const url = new URL(source)
    const normalizedPath = decodeURIComponent(url.pathname)
      .replace(/[\/_-]+/g, ' ')
      .replace(/\b(job|jobs|career|careers|position|positions|openings|apply|team)\b/gi, ' ')

    const roleMatch = normalizeSpace(normalizedPath).match(ROLE_HINT_REGEX)
    if (roleMatch?.[0]) return toTitleCase(cleanRole(roleMatch[0]))
  } catch {
    return null
  }

  return null
}

const inferRoleFromText = (source: string) => {
  const roleLine = source.match(/(?:job title|title|role|position)\s*[:\-]\s*([^\n\r]{2,120})/i)
  if (roleLine?.[1]) return toTitleCase(cleanRole(roleLine[1]))

  const roleMatch = normalizeSpace(source).match(ROLE_HINT_REGEX)
  if (roleMatch?.[0]) return toTitleCase(cleanRole(roleMatch[0]))

  return null
}

const inferCompanyName = (source: string, mode: 'url' | 'text') => {
  if (mode === 'url') {
    try {
      const host = new URL(source).hostname.replace(/^www\./i, '')
      const first = host.split('.')[0]
      if (!first) return null
      return toTitleCase(first.replace(/[^a-z0-9]/gi, ' '))
    } catch {
      return null
    }
  }

  const companyLine = source.match(/(?:company|organization|employer)\s*[:\-]\s*([^\n\r]{2,80})/i)
  if (companyLine?.[1]) return normalizeSpace(companyLine[1].replace(/[^\w\s&'.-]/g, ''))

  const atCompany = source.match(/\bat\s+([A-Z][A-Za-z0-9&'. -]{2,50})\b/)
  if (atCompany?.[1]) return normalizeSpace(atCompany[1])

  return null
}

const inferLocation = (source: string, mode: 'url' | 'text', fallbackLocation?: string) => {
  const normalizedSource = source.toLowerCase()
  if (normalizedSource.includes('remote')) return 'Remote'

  if (mode === 'text') {
    const locationLine = source.match(/(?:location|based in)\s*[:\-]\s*([^\n\r]{2,80})/i)
    if (locationLine?.[1]) return normalizeSpace(locationLine[1])
  }

  return fallbackLocation || 'Unspecified'
}

const getDashboardGreeting = (date: Date) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return "It's Getting Late"
}

export function DashboardScreen({ navigation, route }: DashboardProps = {}) {
  const { pipeline, weeklyPlan } = useDashboardStore()
  const { recommendedScanPreset, addJob } = useJobTrackerStore()
  const { name, avatarUrl, nextActions, toggleNextAction } = useUserProfileStore()
  const { sourceResumeName, baselineResumeName, targetRole, locationPreference, setCareerSetup } = useCareerSetupStore()
  const spendScanCredit = useCreditsStore(state => state.spendScanCredit)
  const scanCreditsRemaining = useCreditsStore(state => state.scanCreditsRemaining)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => [...careerLiftNotifications])
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [showResumeScanModal, setShowResumeScanModal] = useState(false)
  const [showCustomPrepModal, setShowCustomPrepModal] = useState(false)
  const [showAddJobModal, setShowAddJobModal] = useState(false)
  const [jobInputMode, setJobInputMode] = useState<'url' | 'text'>('url')
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [showResumeScanProgress, setShowResumeScanProgress] = useState(false)
  const [showJobScanProgress, setShowJobScanProgress] = useState(false)
  const [resumeScanStep, setResumeScanStep] = useState(0)
  const [resumeScanComplete, setResumeScanComplete] = useState(false)
  const [activeResumeScanName, setActiveResumeScanName] = useState('')
  const [jobScanStep, setJobScanStep] = useState(0)
  const [jobScanComplete, setJobScanComplete] = useState(false)
  const [jobScanResult, setJobScanResult] = useState({
    jobsFound: 0,
    topMatch: 0,
    remoteRoles: 0,
  })
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const ringAnimPrimary = useRef(new Animated.Value(0)).current
  const ringAnimSecondary = useRef(new Animated.Value(0)).current

  const firstName = name.split(' ')[0]
  const startScanFromSavedFilters = route?.params?.startScanFromSavedFilters === true
  const isTestEnv = typeof process !== 'undefined' && Boolean(process.env?.JEST_WORKER_ID)
  const appliedCount = pipeline.find(item => item.label === 'Applied')?.value ?? 0
  const storedResumes = useMemo(
    () => Array.from(new Set([sourceResumeName, baselineResumeName].filter((item): item is string => Boolean(item)))),
    [sourceResumeName, baselineResumeName]
  )
  const greeting = `${getDashboardGreeting(currentTime)},`

  useEffect(() => {
    if (isTestEnv) return
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60_000)

    return () => clearInterval(timer)
  }, [isTestEnv])

  useEffect(() => {
    if (isTestEnv) return

    const primaryLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnimPrimary, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringAnimPrimary, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )

    const secondaryLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(850),
        Animated.timing(ringAnimSecondary, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringAnimSecondary, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )

    primaryLoop.start()
    secondaryLoop.start()

    return () => {
      primaryLoop.stop()
      secondaryLoop.stop()
    }
  }, [isTestEnv, ringAnimPrimary, ringAnimSecondary])

  const ringPrimaryStyle = {
    transform: [{ scale: ringAnimPrimary.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.9] }) }],
    opacity: ringAnimPrimary.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
  }

  const ringSecondaryStyle = {
    transform: [{ scale: ringAnimSecondary.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.9] }) }],
    opacity: ringAnimSecondary.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
  }

  const jobScanSteps = useMemo(
    () => [
      'Starting scan',
      recommendedScanPreset
        ? `Syncing preset: ${recommendedScanPreset.name}`
        : 'Syncing default market filters',
      'Scoring role fit and match strength',
      'Refreshing recommended jobs',
    ],
    [recommendedScanPreset]
  )

  const handleNavigate = (screen: string, params?: Record<string, unknown>) => {
    navigation?.navigate?.(screen, params)
  }

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.target) return
    setShowNotifications(false)
    handleNavigate(item.target.screen, item.target.params)
  }

  const handleClearNotification = (id: string) => {
    setNotifications(current => current.filter(item => item.id !== id))
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  const resetAddJobModal = () => {
    setJobInputMode('url')
    setJobDescriptionUrl('')
    setJobDescriptionText('')
  }

  const closeAddJobModal = () => {
    setShowAddJobModal(false)
    resetAddJobModal()
  }

  const handleOpenAddJobModal = () => {
    setShowAddJobModal(true)
  }

  const handleAddJobFromDescription = () => {
    const source = jobInputMode === 'url' ? jobDescriptionUrl.trim() : jobDescriptionText.trim()

    if (!source) {
      Alert.alert('Missing Input', 'Paste a public job URL or paste the job description text.')
      return
    }

    if (jobInputMode === 'url' && !/^https?:\/\/\S+$/i.test(source)) {
      Alert.alert('Invalid URL', 'Enter a valid public job URL that starts with http:// or https://.')
      return
    }

    const inferredRole =
      (jobInputMode === 'url' ? inferRoleFromUrl(source) : inferRoleFromText(source)) ||
      targetRole ||
      'Target Role'
    const inferredCompany = inferCompanyName(source, jobInputMode) || 'Company TBD'
    const inferredLocation = inferLocation(source, jobInputMode, locationPreference)

    const importedJob: JobEntry = {
      id: `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      company: inferredCompany,
      role: inferredRole,
      location: inferredLocation,
      status: 'Target',
      nextAction: 'Submit Application',
      nextActionDate: 'Today',
      tags: ['Imported JD', jobInputMode === 'url' ? 'Public URL' : 'Pasted JD'],
      notes:
        jobInputMode === 'url'
          ? `Imported from: ${source}`
          : `Imported from pasted JD (${source.length} chars)`,
      color: 'rgba(13, 108, 242, 0.12)',
    }

    addJob(importedJob)
    closeAddJobModal()
    Alert.alert('Added to pipeline', `${importedJob.role} at ${importedJob.company} was added.`)
  }

  const buildJobScanResult = () => {
    const scanPresetBoost =
      (recommendedScanPreset?.remoteOnly ? 1 : 0) +
      (recommendedScanPreset?.fullTimeOnly ? 1 : 0) +
      (recommendedScanPreset?.hybridOnly ? 1 : 0)
    const jobsFound = Math.max(4, Math.min(12, Math.round(appliedCount / 2) + 4 + scanPresetBoost))
    const topMatch = Math.max(86, Math.min(99, 84 + appliedCount + scanPresetBoost))
    const normalizedLocationQuery = recommendedScanPreset?.locationQuery.trim().toLowerCase() || ''
    const remotePreference =
      recommendedScanPreset?.remoteOnly ||
      recommendedScanPreset?.screenFilter === 'Remote' ||
      normalizedLocationQuery.includes('remote')
        ? 0.8
        : 0.55
    const remoteRoles = Math.max(1, Math.round(jobsFound * remotePreference))
    return { jobsFound, topMatch, remoteRoles }
  }

  const resetJobScanFlow = () => {
    setShowJobScanProgress(false)
    setJobScanStep(0)
    setJobScanComplete(false)
  }

  const startJobScanFlow = () => {
    const charged = spendScanCredit('Job market scan')
    if (!charged) {
      Alert.alert(
        'No scan credits left',
        'You have reached your scan limit. Purchase scan credits or upgrade to Unlimited in Settings.'
      )
      return false
    }

    setJobScanResult(buildJobScanResult())
    setShowJobScanProgress(true)
    setJobScanStep(0)
    setJobScanComplete(false)
    return true
  }

  const resetResumeScanFlow = () => {
    setShowResumeScanModal(false)
    setShowResumeScanProgress(false)
    setResumeScanStep(0)
    setResumeScanComplete(false)
    setActiveResumeScanName('')
  }

  const startResumeScanFlow = (resumeName: string) => {
    const charged = spendScanCredit('ATS resume scan')
    if (!charged) {
      Alert.alert(
        'No scan credits left',
        'You have reached your scan limit. Purchase scan credits or upgrade to Unlimited in Settings.'
      )
      return false
    }

    setShowResumeScanModal(false)
    setShowResumeScanProgress(true)
    setResumeScanStep(0)
    setResumeScanComplete(false)
    setActiveResumeScanName(resumeName)
    return true
  }

  const handleUploadResumeScan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_RESUME_TYPES,
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) return

      const selectedResume = result.assets[0]?.name || 'Uploaded_Resume'
      setCareerSetup({ sourceResumeName: selectedResume })
      startResumeScanFlow(selectedResume)
    } catch {
      Alert.alert('Upload failed', 'Could not open resume picker.')
    }
  }

  useEffect(() => {
    if (!showResumeScanProgress || resumeScanComplete) return

    if (resumeScanStep >= RESUME_SCAN_STEPS.length) {
      setResumeScanComplete(true)
      return
    }

    const timer = setTimeout(() => {
      setResumeScanStep(step => step + 1)
    }, 750)

    return () => clearTimeout(timer)
  }, [showResumeScanProgress, resumeScanComplete, resumeScanStep])

  useEffect(() => {
    if (!showJobScanProgress || jobScanComplete) return

    if (jobScanStep >= jobScanSteps.length) {
      setJobScanComplete(true)
      return
    }

    const timer = setTimeout(() => {
      setJobScanStep(step => step + 1)
    }, 800)

    return () => clearTimeout(timer)
  }, [showJobScanProgress, jobScanComplete, jobScanStep, jobScanSteps.length])

  useEffect(() => {
    if (!showResumeScanProgress || !resumeScanComplete || !activeResumeScanName) return

    const selectedResume = activeResumeScanName
    const doneTimer = setTimeout(() => {
      setShowResumeScanProgress(false)
      setResumeScanStep(0)
      setResumeScanComplete(false)
      setActiveResumeScanName('')
      navigation?.navigate?.('ATSResults', { resumeName: selectedResume })
    }, 700)

    return () => clearTimeout(doneTimer)
  }, [showResumeScanProgress, resumeScanComplete, activeResumeScanName, navigation])

  useEffect(() => {
    if (!startScanFromSavedFilters || showJobScanProgress) return
    startJobScanFlow()
    navigation?.setParams?.({ startScanFromSavedFilters: undefined })
  }, [startScanFromSavedFilters, showJobScanProgress])

  const isJobScanning = showJobScanProgress && !jobScanComplete
  const hasFreshJobScan = showJobScanProgress && jobScanComplete
  const currentJobScanStepText = isJobScanning
    ? jobScanSteps[Math.min(jobScanStep, jobScanSteps.length - 1)]
    : recommendedScanPreset
      ? `Preset: ${recommendedScanPreset.name}`
      : 'Ready to scan jobs'
  const newScanButtonLabel = isJobScanning ? 'Scanning...' : hasFreshJobScan ? `${jobScanResult.jobsFound} Found` : 'New Scan'
  const newScanButtonSubtitle = isJobScanning
    ? currentJobScanStepText
    : hasFreshJobScan
      ? `Top match ${jobScanResult.topMatch}%`
      : currentJobScanStepText
  const scanBalanceText =
    scanCreditsRemaining === null ? 'Unlimited scans' : `${scanCreditsRemaining} scans left`

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'applied',
        title: `Applied (${appliedCount})`,
        subtitle: 'Open tracker pipeline',
        icon: 'assignment-turned-in',
        iconColor: '#0d6cf2',
        iconBg: 'rgba(13, 108, 242, 0.12)',
        onPress: () => handleNavigate('JobTracker', { initialStatus: 'Applied' }),
      },
      {
        id: 'custom-practice',
        title: 'Custom Job Practice',
        subtitle: 'Start custom interview prep',
        icon: 'record-voice-over',
        iconColor: '#a855f7',
        iconBg: 'rgba(168, 85, 247, 0.14)',
        onPress: () => setShowCustomPrepModal(true),
      },
      {
        id: 'resume-scan',
        title: 'Resume Scan',
        subtitle: 'Run ATS fit scan',
        icon: 'description',
        iconColor: '#f59e0b',
        iconBg: 'rgba(245, 158, 11, 0.14)',
        onPress: () => setShowResumeScanModal(true),
      },
      {
        id: 'linkedin-optimize',
        title: 'Optimize LinkedIn',
        subtitle: 'Open LinkedIn Kit',
        icon: 'business-center',
        iconColor: '#22c55e',
        iconBg: 'rgba(34, 197, 94, 0.14)',
        onPress: () => handleNavigate('LinkedInKit'),
      },
    ],
    [appliedCount, navigation]
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => handleNavigate('SettingsProfile')}
            accessibilityLabel='Open profile'
          >
            <Image
              source={{
                uri: avatarUrl || 'https://i.pravatar.cc/150',
              }}
              style={styles.avatar}
            />
            <View style={styles.statusDot} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText}>{firstName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.newScanButton,
              isJobScanning && styles.newScanButtonActive,
              hasFreshJobScan && styles.newScanButtonSuccess,
            ]}
            accessibilityLabel='Start new scan'
            onPress={isJobScanning ? undefined : startJobScanFlow}
            activeOpacity={0.85}
          >
            <View style={styles.sonarWrap}>
              {!hasFreshJobScan ? (
                <>
                  <Animated.View style={[styles.sonarRing, ringPrimaryStyle]} />
                  <Animated.View style={[styles.sonarRing, ringSecondaryStyle]} />
                </>
              ) : null}
              <View style={[styles.sonarCore, isJobScanning && styles.sonarCoreActive, hasFreshJobScan && styles.sonarCoreSuccess]}>
                <MaterialIcons
                  name={hasFreshJobScan ? 'check-circle' : 'radar'}
                  size={16}
                  color={hasFreshJobScan ? CLTheme.status.success : CLTheme.accent}
                />
              </View>
            </View>
            <View>
              <Text style={[styles.newScanText, hasFreshJobScan && styles.newScanTextSuccess]}>{newScanButtonLabel}</Text>
              <Text style={[styles.newScanSubText, hasFreshJobScan && styles.newScanSubTextSuccess]}>{newScanButtonSubtitle}</Text>
              <Text style={styles.scanBalanceText}>{scanBalanceText}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowNotifications(true)}
            accessibilityLabel='Open notifications'
          >
            <MaterialIcons name="notifications-none" size={24} color={CLTheme.text.secondary} />
            {notifications.length > 0 ? <View style={styles.bellBadge} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <TouchableOpacity onPress={() => setShowQuickActionsModal(true)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScroll}
        >
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickActionCard}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.quickActionHeader}>
                <View style={[styles.quickActionIconBox, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <MaterialIcons name='chevron-right' size={18} color={CLTheme.text.muted} />
              </View>
              <View>
                <Text style={styles.quickActionTitle}>{item.title}</Text>
                <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weekly Plan */}
        <TouchableOpacity
          style={styles.weeklyPlanCard}
          onPress={() => handleNavigate('WeeklyDigest')}
          activeOpacity={0.85}
        >
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
        </TouchableOpacity>

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
            onPress={() => toggleNextAction(action.id)}
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
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddJobModal}
        accessibilityLabel='Add job to pipeline'
        testID='dashboard-add-job-fab'
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ModalContainer
        visible={showAddJobModal}
        onClose={closeAddJobModal}
        animationType='fade'
        backdropTestID='dashboard-add-job-modal-backdrop'
      >
        <View style={styles.addJobModalCard}>
          <View style={styles.quickActionsModalHeader}>
            <Text style={styles.quickActionsModalTitle}>Import Job Description</Text>
            <TouchableOpacity onPress={closeAddJobModal} accessibilityLabel='Close add job modal'>
              <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.addJobModalBody} keyboardShouldPersistTaps='handled'>
            <Text style={styles.addJobSubtitle}>
              Add a public JD URL or paste the full job description. We will extract role/company and add it to your pipeline.
            </Text>

            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, jobInputMode === 'url' && styles.modeTabActive]}
                onPress={() => setJobInputMode('url')}
              >
                <Text style={[styles.modeTabText, jobInputMode === 'url' && styles.modeTabTextActive]}>Public URL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, jobInputMode === 'text' && styles.modeTabActive]}
                onPress={() => setJobInputMode('text')}
              >
                <Text style={[styles.modeTabText, jobInputMode === 'text' && styles.modeTabTextActive]}>Paste JD</Text>
              </TouchableOpacity>
            </View>

            {jobInputMode === 'url' ? (
              <View style={styles.addJobInputBlock}>
                <Text style={styles.addJobInputLabel}>Job URL</Text>
                <TextInput
                  style={styles.addJobInput}
                  value={jobDescriptionUrl}
                  onChangeText={setJobDescriptionUrl}
                  autoCapitalize='none'
                  autoCorrect={false}
                  placeholder='https://company.com/jobs/senior-pm'
                  placeholderTextColor={CLTheme.text.muted}
                />
              </View>
            ) : (
              <View style={styles.addJobInputBlock}>
                <Text style={styles.addJobInputLabel}>Job Description</Text>
                <TextInput
                  style={[styles.addJobInput, styles.addJobTextarea]}
                  value={jobDescriptionText}
                  onChangeText={setJobDescriptionText}
                  multiline
                  textAlignVertical='top'
                  placeholder='Paste the full job description text here'
                  placeholderTextColor={CLTheme.text.muted}
                />
              </View>
            )}

            <View style={styles.addJobActions}>
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={closeAddJobModal}>
                <Text style={styles.secondaryActionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleAddJobFromDescription}>
                <Text style={styles.primaryActionBtnText}>Extract & Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        animationType='fade'
        backdropTestID='quick-actions-modal-backdrop'
      >
        <View style={styles.quickActionsModalCard}>
          <View style={styles.quickActionsModalHeader}>
            <Text style={styles.quickActionsModalTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={() => setShowQuickActionsModal(false)} accessibilityLabel='Close quick actions'>
              <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsModalList}>
            {quickActions.map(item => (
              <TouchableOpacity
                key={`modal-${item.id}`}
                style={styles.quickActionsModalRow}
                onPress={() => {
                  setShowQuickActionsModal(false)
                  item.onPress()
                }}
              >
                <View style={[styles.quickActionIconBox, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickActionTitle}>{item.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
                </View>
                <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={showResumeScanModal}
        onClose={resetResumeScanFlow}
        animationType='fade'
        backdropTestID='resume-scan-modal-backdrop'
      >
        <View style={styles.resumeScanModalCard}>
          <View style={styles.quickActionsModalHeader}>
            <Text style={styles.quickActionsModalTitle}>Resume Scan</Text>
            <TouchableOpacity onPress={resetResumeScanFlow} accessibilityLabel='Close resume scan setup'>
              <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.resumeScanContent}>
            <Text style={styles.resumeScanBodyText}>
              Upload a resume or choose one already saved to your profile.
            </Text>
            <Text style={styles.resumeScanHintText}>
              {scanCreditsRemaining === null ? 'Unlimited scans available on your plan.' : `${scanCreditsRemaining} scans remaining`}
            </Text>

            <TouchableOpacity
              style={styles.resumeUploadButton}
              onPress={handleUploadResumeScan}
              accessibilityLabel='Upload resume for scan'
            >
              <MaterialIcons name='upload-file' size={18} color={CLTheme.accent} />
              <Text style={styles.resumeUploadButtonText}>Upload Resume</Text>
            </TouchableOpacity>

            <Text style={styles.resumeScanSectionTitle}>Saved Resumes</Text>
            {storedResumes.length === 0 ? (
              <Text style={styles.resumeScanEmptyText}>
                No saved resumes yet. Upload one to continue.
              </Text>
            ) : (
              <View style={styles.resumeScanList}>
                {storedResumes.map(resumeName => (
                  <TouchableOpacity
                    key={resumeName}
                    style={styles.resumeScanRow}
                    onPress={() => startResumeScanFlow(resumeName)}
                    accessibilityLabel={`Use resume ${resumeName}`}
                  >
                    <View style={styles.resumeScanFileIcon}>
                      <MaterialIcons name='description' size={16} color={CLTheme.accent} />
                    </View>
                    <Text style={styles.resumeScanFileName} numberOfLines={1}>
                      {resumeName}
                    </Text>
                    <MaterialIcons name='chevron-right' size={18} color={CLTheme.text.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={showResumeScanProgress}
        onClose={resetResumeScanFlow}
        animationType='fade'
        backdropTestID='resume-scan-progress-backdrop'
      >
        <View style={styles.processingCard}>
          {resumeScanComplete ? (
            <MaterialIcons name='check-circle' size={40} color={CLTheme.status.success} />
          ) : (
            <ActivityIndicator size='large' color={CLTheme.accent} />
          )}
          <Text style={styles.processingTitle}>
            {resumeScanComplete ? 'Resume scan ready' : 'Scanning your resume'}
          </Text>
          <Text style={styles.processingSubtitle}>
            {resumeScanComplete
              ? `Loaded: ${activeResumeScanName}`
              : `Processing ${activeResumeScanName || 'selected resume'} for ATS results.`}
          </Text>

          <View style={styles.stepList}>
            {RESUME_SCAN_STEPS.map((step, index) => {
              const isDone = resumeScanComplete || index < resumeScanStep
              const isActive = !resumeScanComplete && index === resumeScanStep

              return (
                <View key={step} style={styles.stepRow}>
                  <MaterialIcons
                    name={isDone ? 'check-circle' : isActive ? 'pending' : 'radio-button-unchecked'}
                    size={18}
                    color={isDone ? CLTheme.status.success : isActive ? CLTheme.accent : CLTheme.text.muted}
                  />
                  <Text style={[styles.stepText, isDone && styles.stepTextDone, isActive && styles.stepTextActive]}>
                    {step}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={showJobScanProgress}
        onClose={resetJobScanFlow}
        animationType='fade'
        backdropTestID='job-scan-progress-backdrop'
      >
        <View style={styles.processingCard}>
          {jobScanComplete ? (
            <MaterialIcons name='check-circle' size={40} color={CLTheme.status.success} />
          ) : (
            <ActivityIndicator size='large' color={CLTheme.accent} />
          )}
          <Text style={styles.processingTitle}>
            {jobScanComplete ? `${jobScanResult.jobsFound} jobs found` : 'Running market scan'}
          </Text>
          <Text style={styles.processingSubtitle}>
            {jobScanComplete
              ? `Top match ${jobScanResult.topMatch}% • ${jobScanResult.remoteRoles} remote-friendly roles${recommendedScanPreset ? ` • ${recommendedScanPreset.name}` : ''}`
              : currentJobScanStepText}
          </Text>

          <View style={styles.stepList}>
            {jobScanSteps.map((step, index) => {
              const isDone = jobScanComplete || index < jobScanStep
              const isActive = !jobScanComplete && index === jobScanStep

              return (
                <View key={step} style={styles.stepRow}>
                  <MaterialIcons
                    name={isDone ? 'check-circle' : isActive ? 'pending' : 'radio-button-unchecked'}
                    size={18}
                    color={isDone ? CLTheme.status.success : isActive ? CLTheme.accent : CLTheme.text.muted}
                  />
                  <Text style={[styles.stepText, isDone && styles.stepTextDone, isActive && styles.stepTextActive]}>
                    {step}
                  </Text>
                </View>
              )
            })}
          </View>

          {jobScanComplete ? (
            <View style={styles.jobScanActions}>
              <TouchableOpacity style={styles.scanSecondaryBtn} onPress={resetJobScanFlow} accessibilityLabel='Close job scan result'>
                <Text style={styles.scanSecondaryBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanPrimaryBtn}
                onPress={() => {
                  resetJobScanFlow()
                  handleNavigate('RecommendedJobs')
                }}
                accessibilityLabel='View scanned jobs'
              >
                <Text style={styles.scanPrimaryBtnText}>View Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ModalContainer>

      <CustomPrepEntryModal
        visible={showCustomPrepModal}
        onClose={() => setShowCustomPrepModal(false)}
        onSubmit={(customPrep) => {
          setShowCustomPrepModal(false)
          handleNavigate('InterviewPrep', { customPrep })
        }}
      />

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
    gap: 8,
    backgroundColor: 'rgba(13, 108, 242, 0.15)', // slightly more visibility on dark
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  newScanButtonActive: {
    backgroundColor: 'rgba(13, 108, 242, 0.22)',
  },
  newScanButtonSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  sonarWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sonarCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 108, 242, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sonarCoreActive: {
    backgroundColor: 'rgba(13, 108, 242, 0.22)',
  },
  sonarCoreSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  sonarRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: 'rgba(13, 108, 242, 0.55)',
  },
  newScanText: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  newScanSubText: {
    fontSize: 9,
    color: CLTheme.text.muted,
    marginTop: 1,
  },
  scanBalanceText: {
    fontSize: 9,
    color: CLTheme.text.muted,
    marginTop: 1,
  },
  newScanTextSuccess: {
    color: CLTheme.status.success,
  },
  newScanSubTextSuccess: {
    color: '#86efac',
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
  quickActionCard: {
    width: 190,
    minHeight: 104,
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: CLTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: CLTheme.text.secondary,
    marginTop: 3,
  },
  quickActionsModalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  quickActionsModalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionsModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  quickActionsModalList: {
    padding: 10,
    gap: 8,
  },
  quickActionsModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    padding: 10,
  },
  addJobModalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    maxHeight: '78%',
    overflow: 'hidden',
  },
  addJobModalBody: {
    padding: 14,
    gap: 12,
  },
  addJobSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    padding: 4,
    marginTop: 2,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
  },
  modeTabActive: {
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  modeTabTextActive: {
    color: CLTheme.accent,
  },
  addJobInputBlock: {
    gap: 8,
  },
  addJobInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addJobInput: {
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    color: CLTheme.text.primary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addJobTextarea: {
    minHeight: 140,
  },
  addJobActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  primaryActionBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: CLTheme.accent,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  resumeScanModalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  resumeScanContent: {
    padding: 14,
  },
  resumeScanBodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
    marginBottom: 8,
  },
  resumeScanHintText: {
    fontSize: 12,
    color: CLTheme.text.muted,
    marginBottom: 12,
  },
  resumeUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: CLTheme.accent,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 108, 242, 0.08)',
    paddingVertical: 12,
    marginBottom: 14,
  },
  resumeUploadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: CLTheme.accent,
  },
  resumeScanSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  resumeScanEmptyText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
  },
  resumeScanList: {
    gap: 8,
  },
  resumeScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  resumeScanFileIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 108, 242, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeScanFileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  processingCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 20,
    alignItems: 'center',
  },
  processingTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  processingSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepList: {
    alignSelf: 'stretch',
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepText: {
    fontSize: 13,
    color: CLTheme.text.muted,
    flex: 1,
  },
  stepTextActive: {
    color: CLTheme.accent,
    fontWeight: '600',
  },
  stepTextDone: {
    color: CLTheme.text.secondary,
  },
  jobScanActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  scanSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingVertical: 11,
  },
  scanSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  scanPrimaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: CLTheme.accent,
  },
  scanPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
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
