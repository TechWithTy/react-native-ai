import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as DocumentPicker from 'expo-document-picker'
import { CLTheme } from './theme'
import { getRoleOptionsForTrack, getSalaryRangesForRole, useCareerSetupStore } from '../../store/careerSetup'
import { useUserProfileStore } from '../../store/userProfileStore'
import { SubscriptionTierId, useCreditsStore } from '../../store/creditsStore'
import {
  MonetizationCopyVariant,
  MonetizationPlacement,
  useMonetizationExperimentsStore,
} from '../../store/monetizationExperimentsStore'
import { SubscriptionModal } from './subscriptionModal'
import { ModalContainer } from './components/modalContainer'
import { LocationAutocomplete } from './components/locationAutocomplete'
import { CreditPacksDrawer } from './components/creditPacksDrawer'
import { CustomInterviewPrepPayload } from '../../../types'
import { ROLE_TRACKS_META } from '../../data/roles'
import { TARGET_SENIORITY_OPTIONS } from '../../data/seniority'
import { getCurrentDeviceLocation } from '../../native/permissions/location'

const PLAN_LABELS: Record<SubscriptionTierId, string> = {
  starter: 'STARTER',
  pro: 'PRO',
  unlimited: 'UNLIMITED',
}

const ROLE_UPDATE_STEPS = [
  'Validating job description source',
  'Extracting role requirements',
  'Rebuilding interview prep focus areas',
  'Building your custom interview prep flow',
]

type ProfileSelectionType = 'industry' | 'seniority' | 'role' | 'salary' | 'openToWork' | null

export function SettingsProfileScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const [calendarSync, setCalendarSync] = useState(true)
  const [showRoleUpdateModal, setShowRoleUpdateModal] = useState(false)
  const [showRoleUpdateProgress, setShowRoleUpdateProgress] = useState(false)
  const [jobInputMode, setJobInputMode] = useState<'url' | 'text'>('url')
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [isProcessingComplete, setIsProcessingComplete] = useState(false)
  const [pendingTargetRole, setPendingTargetRole] = useState('')
  const [generatedCustomPrep, setGeneratedCustomPrep] = useState<CustomInterviewPrepPayload | null>(null)
  const [showSubscription, setShowSubscription] = useState(false)
  const [showCreditPackages, setShowCreditPackages] = useState(false)
  const [showScanPackages, setShowScanPackages] = useState(false)
  const [subscriptionCopyVariant, setSubscriptionCopyVariant] = useState<MonetizationCopyVariant>('classic')
  const [creditsCopyVariant, setCreditsCopyVariant] = useState<MonetizationCopyVariant>('classic')
  const [scanCopyVariant, setScanCopyVariant] = useState<MonetizationCopyVariant>('classic')
  const [selectionType, setSelectionType] = useState<ProfileSelectionType>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const creditBalance = useCreditsStore(state => state.balance)
  const subscriptionTier = useCreditsStore(state => state.subscriptionTier)
  const scanCreditsRemaining = useCreditsStore(state => state.scanCreditsRemaining)
  const setSubscriptionTier = useCreditsStore(state => state.setSubscriptionTier)
  const evaluatePlacement = useMonetizationExperimentsStore(state => state.evaluatePlacement)

  const { 
    targetRole, 
    roleTrack, 
    seniority, 
    desiredSalaryRange,
    locationPreference,
    locationPreferences,
    setCareerSetup,
  } = useCareerSetupStore()
  
  const { 
    name, 
    email,
    avatarUrl, 
    currentLocation, 
    isOpenToWork,
    setProfile,
  } = useUserProfileStore()

  const hasRemoteWorkingPreference =
    locationPreferences.includes('Remote') || locationPreference.trim().toLowerCase() === 'remote'
  const profileLocationLabel =
    currentLocation.trim().length > 0 ? currentLocation : hasRemoteWorkingPreference ? 'Remote' : 'No location'

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setLocationInput(profileLocationLabel === 'No location' ? '' : profileLocationLabel)

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setIsRefreshing(false)
      refreshTimeoutRef.current = null
    }, 850)
  }, [isRefreshing, profileLocationLabel])

  const handleEditProfile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.length) return

      const selectedImage = result.assets[0]?.uri
      if (!selectedImage) return

      setProfile({ avatarUrl: selectedImage })
    } catch {
      Alert.alert('Upload failed', 'Could not open file picker.')
    }
  }

  const handleManageSubscription = () => {
    Alert.alert('Manage Subscription', 'Navigate to subscription settings')
  }

  const handleOpenAccountSecurity = () => {
    ;(navigation as any).navigate('AccountSecurity')
  }

  const handleOpenNotificationsPreferences = () => {
    ;(navigation as any).navigate('NotificationsPreferences')
  }

  const handleOpenDocumentsInsights = () => {
    ;(navigation as any).navigate('DocumentsInsights')
  }

  const openMonetizationPlacement = (placement: MonetizationPlacement) => {
    const decision = evaluatePlacement({
      placement,
      seedKey: email || 'anonymous',
    })

    if (decision.surface === 'holdout' || decision.isHoldout) {
      Alert.alert('No offer right now', 'You are currently in a holdout experience for this placement.')
      return
    }

    if (decision.surface === 'subscription') {
      setSubscriptionCopyVariant(decision.copyVariant)
      setShowSubscription(true)
      return
    }

    if (decision.surface === 'ai_credits') {
      setCreditsCopyVariant(decision.copyVariant)
      setShowCreditPackages(true)
      return
    }

    setScanCopyVariant(decision.copyVariant)
    setShowScanPackages(true)
  }

  const inferTargetRole = (source: string) => {
    const roleOptions = getRoleOptionsForTrack(roleTrack || 'Engineering')
    const normalized = source.toLowerCase().replace(/[-_/]/g, ' ')

    const exactMatch = roleOptions.find(option => normalized.includes(option.toLowerCase()))
    if (exactMatch) return exactMatch

    const partialMatch = roleOptions.find(option => {
      const [firstWord] = option.toLowerCase().split(' ')
      return firstWord.length > 2 && normalized.includes(firstWord)
    })
    if (partialMatch) return partialMatch

    return targetRole || roleOptions[0] || 'Software Engineer'
  }

  const inferCompanyName = (source: string, mode: 'url' | 'text') => {
    if (mode === 'url') {
      try {
        const host = new URL(source).hostname.replace('www.', '')
        const [namePart] = host.split('.')
        if (!namePart) return null
        return namePart.charAt(0).toUpperCase() + namePart.slice(1)
      } catch {
        return null
      }
    }

    const companyMatch = source.match(/(?:company|about)\s*:?\s*([A-Z][A-Za-z0-9 &.-]{2,40})/i)
    return companyMatch?.[1]?.trim() ?? null
  }

  const inferFocusAreas = (source: string, inferredRole: string) => {
    const normalized = source.toLowerCase()
    const inferred: string[] = []

    if (normalized.includes('stakeholder') || normalized.includes('cross-functional')) {
      inferred.push('Stakeholder Management')
    }
    if (normalized.includes('data') || normalized.includes('analytics') || normalized.includes('sql')) {
      inferred.push('Data-Driven Decisions')
    }
    if (normalized.includes('roadmap') || normalized.includes('strategy')) {
      inferred.push('Product Strategy')
    }
    if (normalized.includes('lead') || normalized.includes('ownership')) {
      inferred.push('Leadership')
    }
    if (normalized.includes('customer') || normalized.includes('user research')) {
      inferred.push('Customer Empathy')
    }

    if (inferred.length === 0) {
      inferred.push(`${inferredRole} Fundamentals`, 'Behavioral STAR Stories', 'Role-Specific Tradeoffs')
    }

    return inferred.slice(0, 4)
  }

  const roleOptions = getRoleOptionsForTrack(roleTrack || 'Engineering')
  const salaryOptions = getSalaryRangesForRole(roleTrack || 'Engineering', targetRole || roleOptions[0])
  const industryOptions = ROLE_TRACKS_META.map(item => item.label)

  const getDisplaySeniority = () => {
    const normalized = (seniority || '').toLowerCase()
    const matched = TARGET_SENIORITY_OPTIONS.find(
      item => item.label.toLowerCase() === normalized || item.legacy?.toLowerCase() === normalized
    )
    return matched?.label || seniority || 'Mid-Level'
  }

  const seniorityOptions = TARGET_SENIORITY_OPTIONS.map(item => item.label)

  const selectionTitleMap: Record<Exclude<ProfileSelectionType, null>, string> = {
    industry: 'Select Industry',
    seniority: 'Select Seniority',
    role: 'Select Target Role',
    salary: 'Select Salary Range',
    openToWork: 'Update Work Status',
  }

  const selectionOptions = (() => {
    if (!selectionType) return []
    if (selectionType === 'industry') return industryOptions
    if (selectionType === 'seniority') return seniorityOptions
    if (selectionType === 'role') return roleOptions
    if (selectionType === 'salary') return salaryOptions
    return ['Open to Work', 'Not Open to Work']
  })()

  const getSelectedSelectionValue = (() => {
    if (!selectionType) return ''
    if (selectionType === 'industry') return roleTrack || 'Engineering'
    if (selectionType === 'seniority') return getDisplaySeniority()
    if (selectionType === 'role') return targetRole || roleOptions[0]
    if (selectionType === 'salary') return desiredSalaryRange || salaryOptions[0] || ''
    return isOpenToWork ? 'Open to Work' : 'Not Open to Work'
  })()

  const handleSelectionPress = (value: string) => {
    if (!selectionType) return

    if (selectionType === 'industry') {
      const nextRoleOptions = getRoleOptionsForTrack(value)
      const nextRole = nextRoleOptions.includes(targetRole) ? targetRole : nextRoleOptions[0]
      const nextSalary = getSalaryRangesForRole(value, nextRole)[0] || desiredSalaryRange
      setCareerSetup({
        roleTrack: value,
        targetRole: nextRole,
        desiredSalaryRange: nextSalary,
      })
      setSelectionType(null)
      return
    }

    if (selectionType === 'seniority') {
      setCareerSetup({ seniority: value, targetSeniority: value })
      setSelectionType(null)
      return
    }

    if (selectionType === 'role') {
      const nextSalary = getSalaryRangesForRole(roleTrack || 'Engineering', value)[0] || desiredSalaryRange
      setCareerSetup({ targetRole: value, desiredSalaryRange: nextSalary })
      setSelectionType(null)
      return
    }

    if (selectionType === 'salary') {
      setCareerSetup({ desiredSalaryRange: value })
      setSelectionType(null)
      return
    }

    setProfile({ isOpenToWork: value === 'Open to Work' })
    setSelectionType(null)
  }

  const resetRoleUpdateFlow = () => {
    setShowRoleUpdateModal(false)
    setShowRoleUpdateProgress(false)
    setJobDescriptionUrl('')
    setJobDescriptionText('')
    setActiveStep(0)
    setIsProcessingComplete(false)
    setPendingTargetRole('')
    setGeneratedCustomPrep(null)
  }

  const handleStartInterviewPrepUpdate = () => {
    const source = jobInputMode === 'url' ? jobDescriptionUrl.trim() : jobDescriptionText.trim()
    if (!source) {
      Alert.alert('Missing Input', 'Paste a job description URL or job description text to continue.')
      return
    }

    if (jobInputMode === 'url' && !/^https?:\/\/\S+$/i.test(source)) {
      Alert.alert('Invalid URL', 'Enter a valid job description URL that starts with http:// or https://.')
      return
    }

    const inferredRole = inferTargetRole(source)
    const prepPayload: CustomInterviewPrepPayload = {
      inferredRole,
      roleTrack: roleTrack || 'Engineering',
      companyName: inferCompanyName(source, jobInputMode),
      sourceType: jobInputMode,
      sourcePreview: source.slice(0, 180),
      focusAreas: inferFocusAreas(source, inferredRole),
      generatedAt: new Date().toISOString(),
    }

    setPendingTargetRole(inferredRole)
    setGeneratedCustomPrep(prepPayload)
    setShowRoleUpdateModal(false)
    setShowRoleUpdateProgress(true)
    setActiveStep(0)
    setIsProcessingComplete(false)
  }

  const openCustomPrepAt = (route as any)?.params?.openCustomPrepAt as number | undefined
  useEffect(() => {
    if (!openCustomPrepAt) return
    setShowRoleUpdateModal(true)
  }, [openCustomPrepAt])

  useEffect(() => {
    setLocationInput(profileLocationLabel === 'No location' ? '' : profileLocationLabel)
  }, [profileLocationLabel])

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true)
      const locationResult = await getCurrentDeviceLocation()
      if (locationResult.status !== 'granted' || !locationResult.label) {
        const message =
          locationResult.status === 'blocked'
            ? 'Location permission is blocked. Enable it from device settings to auto-fill your current location.'
            : 'Allow location access to auto-fill your current location.'
        Alert.alert('Location Permission Needed', message)
        return
      }

      setLocationInput(locationResult.label)
      setProfile({ currentLocation: locationResult.label })
      setShowLocationModal(false)
    } catch {
      Alert.alert('Unable to detect location', 'Try searching and selecting a location manually.')
    } finally {
      setIsLocating(false)
    }
  }

  const navigateToInterviewPrep = (customPrep: CustomInterviewPrepPayload) => {
    let currentNavigation: any = navigation

    while (currentNavigation) {
      const routeNames = currentNavigation.getState?.()?.routeNames as string[] | undefined
      if (routeNames?.includes('InterviewPrep')) {
        currentNavigation.navigate('InterviewPrep', { customPrep })
        return
      }

      currentNavigation = currentNavigation.getParent?.()
    }

    ;(navigation as any).navigate('InterviewPrep', { customPrep })
  }

  useEffect(() => {
    if (!showRoleUpdateProgress) return
    if (isProcessingComplete) return

    if (activeStep >= ROLE_UPDATE_STEPS.length) {
      setIsProcessingComplete(true)
      setCareerSetup({ targetRole: pendingTargetRole || targetRole })
      return
    }

    const timer = setTimeout(() => {
      setActiveStep(step => step + 1)
    }, 900)

    return () => clearTimeout(timer)
  }, [
    showRoleUpdateProgress,
    isProcessingComplete,
    activeStep,
    pendingTargetRole,
    targetRole,
    setCareerSetup,
  ])

  useEffect(() => {
    if (!showRoleUpdateProgress || !isProcessingComplete || !generatedCustomPrep) return

    const doneTimer = setTimeout(() => {
      setShowRoleUpdateProgress(false)
      navigateToInterviewPrep(generatedCustomPrep)
      resetRoleUpdateFlow()
    }, 700)

    return () => clearTimeout(doneTimer)
  }, [
    showRoleUpdateProgress,
    isProcessingComplete,
    generatedCustomPrep,
    navigation,
  ])

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={CLTheme.accent}
            colors={[CLTheme.accent]}
            progressBackgroundColor={CLTheme.card}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl || 'https://i.pravatar.cc/150' }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              accessibilityLabel='Edit profile photo'
            >
              <MaterialIcons name="edit" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.roleText}>{targetRole || 'Software Engineer'}</Text>

          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.pill, isOpenToWork ? styles.pillBlue : styles.pillGray]}
              onPress={() => setSelectionType('openToWork')}
            >
              <Text style={isOpenToWork ? styles.pillTextBlue : styles.pillTextGray}>
                {isOpenToWork ? 'Open to Work' : 'Not Open to Work'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, styles.pillGray]} onPress={() => setShowLocationModal(true)}>
              <Text style={styles.pillTextGray}>{profileLocationLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Target Role Track */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TARGET ROLE TRACK</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => setSelectionType('industry')}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="layers" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Industry</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{roleTrack || 'Engineering'}</Text>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={() => setSelectionType('seniority')}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="trending-up" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Seniority Level</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{getDisplaySeniority()}</Text>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={() => setSelectionType('role')}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="work-outline" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Target Role</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{targetRole || roleOptions[0]}</Text>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={() => setSelectionType('salary')}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="attach-money" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Salary Range</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{desiredSalaryRange || salaryOptions[0]}</Text>
                <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={() => setShowRoleUpdateModal(true)}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="description" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Custom Interview Prep</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>URL or pasted JD</Text>
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

        {/* Section: AI Credits & Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI CREDITS & PLANS</Text>
          <View style={styles.card}>
            {/* Credit Balance Row */}
            <View style={styles.creditBalanceRow}>
              <View style={styles.creditBalanceLeft}>
                <View style={[styles.iconBoxLarge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Feather name="zap" size={22} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.creditBalanceLabel}>Available Credits</Text>
                  <Text style={styles.creditBalanceValue}>
                    {creditBalance}
                    <Text style={styles.creditBalanceSuffix}> credits</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addCreditsChip}
                onPress={() => openMonetizationPlacement('settings_buy_ai_credits')}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={styles.addCreditsChipText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* Buy Credit Packages */}
            <TouchableOpacity style={styles.row} onPress={() => openMonetizationPlacement('settings_buy_ai_credits')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <MaterialIcons name="shopping-cart" size={20} color="#6366f1" />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Buy Credit Packages</Text>
                  <Text style={styles.rowHint}>One-time packs starting at $4.99</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Subscription Upsell */}
            <TouchableOpacity style={styles.row} onPress={() => openMonetizationPlacement('settings_upgrade_plan')}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <MaterialIcons name="diamond" size={20} color="#a855f7" />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Upgrade Plan</Text>
                  <Text style={styles.rowHint}>Unlock auto-apply, unlimited credits, and unlimited scans</Text>
                </View>
              </View>
              <View style={styles.upgradePill}>
                <Text style={styles.upgradePillText}>UPGRADE</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Scan Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCAN CREDITS</Text>
          <View style={styles.card}>
            <View style={styles.creditBalanceRow}>
              <View style={styles.creditBalanceLeft}>
                <View style={[styles.iconBoxLarge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialIcons name='radar' size={22} color='#f59e0b' />
                </View>
                <View>
                  <Text style={styles.creditBalanceLabel}>Scans Available</Text>
                  <Text style={styles.creditBalanceValue}>
                    {scanCreditsRemaining === null ? 'Unlimited' : scanCreditsRemaining}
                    <Text style={styles.creditBalanceSuffix}>
                      {scanCreditsRemaining === null ? '' : ' scans'}
                    </Text>
                  </Text>
                </View>
              </View>
              {scanCreditsRemaining !== null ? (
                <TouchableOpacity
                  style={styles.addCreditsChip}
                  onPress={() => openMonetizationPlacement('settings_buy_scan_credits')}
                >
                  <Feather name='plus' size={14} color='#fff' />
                  <Text style={styles.addCreditsChipText}>Add Scans</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.upgradePill}>
                  <Text style={styles.upgradePillText}>UNLIMITED</Text>
                </View>
              )}
            </View>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => openMonetizationPlacement('settings_buy_scan_credits')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialIcons name='shopping-cart' size={20} color='#f59e0b' />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Buy Scan Packs</Text>
                  <Text style={styles.rowHint}>One-time packs for extra market and resume scans</Text>
                </View>
              </View>
              <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>
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
                <Text style={styles.proText}>{PLAN_LABELS[subscriptionTier]}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.purchaseCreditsLink}
              onPress={() => openMonetizationPlacement('settings_buy_ai_credits')}
            >
              <Feather name="zap" size={14} color={CLTheme.accent} />
              <Text style={styles.purchaseCreditsText}>Purchase AI Credits</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.purchaseCreditsLink}
              onPress={() => openMonetizationPlacement('settings_buy_scan_credits')}
            >
              <MaterialIcons name='radar' size={14} color={CLTheme.accent} />
              <Text style={styles.purchaseCreditsText}>Purchase Scan Credits</Text>
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

            <TouchableOpacity style={styles.row} onPress={handleOpenNotificationsPreferences}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(13, 108, 242, 0.15)' }]}>
                  <MaterialIcons name="notifications-none" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={handleOpenAccountSecurity}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(13, 108, 242, 0.15)' }]}>
                  <MaterialIcons name="shield" size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Account & Security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.row} onPress={handleOpenDocumentsInsights}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(13, 108, 242, 0.15)' }]}>
                  <MaterialIcons name='folder-open' size={20} color={CLTheme.accent} />
                </View>
                <Text style={styles.rowLabel}>Documents & Insights</Text>
              </View>
              <MaterialIcons name='chevron-right' size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Career Lift v2.4.1 (Build 890)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <ModalContainer
        visible={showRoleUpdateModal}
        onClose={resetRoleUpdateFlow}
        animationType='slide'
        backdropTestID='custom-prep-modal-backdrop'
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Custom Interview Prep</Text>
            <TouchableOpacity onPress={resetRoleUpdateFlow}>
              <MaterialIcons name="close" size={22} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Add a job URL or paste the job description to build a custom prep flow.
          </Text>

          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, jobInputMode === 'url' && styles.modeTabActive]}
              onPress={() => setJobInputMode('url')}
            >
              <Text style={[styles.modeTabText, jobInputMode === 'url' && styles.modeTabTextActive]}>
                Job URL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, jobInputMode === 'text' && styles.modeTabActive]}
              onPress={() => setJobInputMode('text')}
            >
              <Text style={[styles.modeTabText, jobInputMode === 'text' && styles.modeTabTextActive]}>
                Paste Text
              </Text>
            </TouchableOpacity>
          </View>

          {jobInputMode === 'url' ? (
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Job Description URL</Text>
              <TextInput
                value={jobDescriptionUrl}
                onChangeText={setJobDescriptionUrl}
                style={styles.textInput}
                placeholder='https://company.com/jobs/senior-pm'
                placeholderTextColor={CLTheme.text.muted}
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>
          ) : (
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Job Description Text</Text>
              <TextInput
                value={jobDescriptionText}
                onChangeText={setJobDescriptionText}
                style={[styles.textInput, styles.textArea]}
                placeholder='Paste the full job description text here'
                placeholderTextColor={CLTheme.text.muted}
                multiline
                textAlignVertical='top'
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetRoleUpdateFlow}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartInterviewPrepUpdate}>
              <Text style={styles.primaryButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={showRoleUpdateProgress}
        onClose={resetRoleUpdateFlow}
        animationType='fade'
        backdropTestID='processing-modal-backdrop'
      >
        <View style={styles.processingCard}>
          {isProcessingComplete ? (
            <MaterialIcons name="check-circle" size={40} color={CLTheme.status.success} />
          ) : (
            <ActivityIndicator size='large' color={CLTheme.accent} />
          )}
          <Text style={styles.processingTitle}>
            {isProcessingComplete ? 'Custom interview prep ready' : 'Building custom interview prep'}
          </Text>
          <Text style={styles.processingSubtitle}>
            {isProcessingComplete
              ? `Target role: ${pendingTargetRole || targetRole}`
              : 'Analyzing your input and preparing a role-specific interview flow.'}
          </Text>

          <View style={styles.stepList}>
            {ROLE_UPDATE_STEPS.map((step, index) => {
              const isDone = isProcessingComplete || index < activeStep
              const isActive = !isProcessingComplete && index === activeStep

              return (
                <View key={step} style={styles.stepRow}>
                  <MaterialIcons
                    name={isDone ? 'check-circle' : isActive ? 'pending' : 'radio-button-unchecked'}
                    size={18}
                    color={
                      isDone ? CLTheme.status.success : isActive ? CLTheme.accent : CLTheme.text.muted
                    }
                  />
                  <Text
                    style={[
                      styles.stepText,
                      isDone && styles.stepTextDone,
                      isActive && styles.stepTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={selectionType !== null}
        onClose={() => setSelectionType(null)}
        animationType='fade'
        backdropTestID='selection-modal-backdrop'
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectionType ? selectionTitleMap[selectionType] : ''}</Text>
            <TouchableOpacity onPress={() => setSelectionType(null)}>
              <MaterialIcons name="close" size={22} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.selectionList}>
            {selectionOptions.map(option => {
              const selected = option === getSelectedSelectionValue
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.selectionOption, selected && styles.selectionOptionActive]}
                  onPress={() => handleSelectionPress(option)}
                >
                  <Text style={[styles.selectionOptionText, selected && styles.selectionOptionTextActive]}>
                    {option}
                  </Text>
                  {selected && <Feather name="check" size={16} color={CLTheme.accent} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ModalContainer>

      <ModalContainer
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        animationType='fade'
        backdropTestID='location-modal-backdrop'
      >
        <View style={[styles.modalCard, styles.locationModalCard]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <MaterialIcons name="close" size={22} color={CLTheme.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.locationModalScroll}
            contentContainerStyle={styles.locationModalScrollContent}
            keyboardShouldPersistTaps='handled'
          >
            <Text style={styles.modalSubtitle}>Set the location shown on your profile badge.</Text>
            <Text style={styles.locationSectionLabel}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.gpsLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
              accessibilityLabel='Use current location GPS'
            >
              {isLocating ? (
                <ActivityIndicator size='small' color={CLTheme.accent} />
              ) : (
                <Feather name='crosshair' size={14} color={CLTheme.accent} />
              )}
              <Text style={styles.gpsLocationButtonText}>
                {isLocating ? 'Detecting current location...' : 'Use Current Location (GPS)'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.locationSectionLabel}>Suggested Locations</Text>
            <LocationAutocomplete
              value={locationInput}
              onChangeText={setLocationInput}
              onSelect={setLocationInput}
              currentLocation={currentLocation}
              placeholder='City, State or Remote'
              containerStyle={styles.locationAutocompleteContainer}
              inputContainerStyle={styles.locationInputContainer}
              inputStyle={styles.textInput}
              suggestionsContainerStyle={styles.locationResultsContainer}
              suggestionRowStyle={styles.locationSuggestionRow}
              suggestionTextStyle={styles.locationSuggestionText}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLocationModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                const trimmedLocation = locationInput.trim()
                if (!trimmedLocation) {
                  Alert.alert('Missing Location', 'Enter a location before saving.')
                  return
                }
                setProfile({ currentLocation: trimmedLocation })
                setShowLocationModal(false)
              }}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalContainer>

      <CreditPacksDrawer
        visible={showCreditPackages}
        onClose={() => setShowCreditPackages(false)}
        mode='ai_credits'
        copyVariant={creditsCopyVariant}
        onSeePlansInstead={() => openMonetizationPlacement('settings_upgrade_plan')}
      />

      <CreditPacksDrawer
        visible={showScanPackages}
        onClose={() => setShowScanPackages(false)}
        mode='scan_credits'
        copyVariant={scanCopyVariant}
        onSeePlansInstead={() => openMonetizationPlacement('settings_upgrade_plan')}
      />

      {/* Subscription Upsell Modal */}
      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
        currentBalance={creditBalance}
        selectedTierId={subscriptionTier}
        onSubscribeTier={setSubscriptionTier}
        copyVariant={subscriptionCopyVariant}
      />
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
  modalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
    marginBottom: 14,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
  },
  modeTabActive: {
    backgroundColor: 'rgba(13, 108, 242, 0.2)',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  modeTabTextActive: {
    color: CLTheme.accent,
  },
  inputBlock: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    color: CLTheme.text.primary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 120,
  },
  locationAutocompleteContainer: {
    zIndex: 20,
    marginBottom: 10,
  },
  locationModalCard: {
    maxHeight: '86%',
  },
  locationModalScroll: {
    maxHeight: 360,
  },
  locationModalScrollContent: {
    paddingBottom: 6,
  },
  locationSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  gpsLocationButton: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsLocationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.primary,
  },
  locationInputContainer: {
    backgroundColor: CLTheme.background,
    borderColor: CLTheme.border,
  },
  locationResultsContainer: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    backgroundColor: CLTheme.background,
    maxHeight: 200,
    overflow: 'hidden',
  },
  locationSuggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
  },
  locationSuggestionText: {
    color: CLTheme.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: CLTheme.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
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
  selectionList: {
    gap: 10,
    maxHeight: 320,
  },
  selectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectionOptionActive: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.08)',
  },
  selectionOptionText: {
    fontSize: 14,
    color: CLTheme.text.secondary,
    fontWeight: '500',
  },
  selectionOptionTextActive: {
    color: CLTheme.text.primary,
    fontWeight: '700',
  },
  // ── AI Credits & Plans Section ──
  creditBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  creditBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditBalanceLabel: {
    fontSize: 12,
    color: CLTheme.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditBalanceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: CLTheme.text.primary,
    marginTop: 2,
  },
  creditBalanceSuffix: {
    fontSize: 13,
    fontWeight: '500',
    color: CLTheme.text.secondary,
  },
  addCreditsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CLTheme.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addCreditsChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  rowHint: {
    fontSize: 11,
    color: CLTheme.text.muted,
    marginTop: 2,
  },
  upgradePill: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upgradePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a855f7',
    letterSpacing: 0.8,
  },
  purchaseCreditsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  purchaseCreditsText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  // ── Credit Packages Modal ──
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  packageCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  packageCardPopular: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
  },
  packageBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  packageBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.6,
  },
  packageCreditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  packageCreditsText: {
    fontSize: 20,
    fontWeight: '800',
    color: CLTheme.text.primary,
  },
  packageCreditsLabel: {
    fontSize: 11,
    color: CLTheme.text.muted,
    fontWeight: '500',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.accent,
    marginTop: 2,
  },
  packagePerCredit: {
    fontSize: 10,
    color: CLTheme.text.muted,
    fontWeight: '500',
    marginTop: 2,
  },
})
