import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Modal,
  Animated,
  Pressable,
  Easing,
  Alert,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { useJobTrackerStore, JobEntry } from '../../store/jobTrackerStore'
import { useUserProfileStore } from '../../store/userProfileStore'
import { useCareerSetupStore } from '../../store/careerSetup'
import { useCreditsStore, CREDIT_COSTS } from '../../store/creditsStore'
import { CLTheme } from './theme'
import { CustomPrepEntryModal } from './components/customPrepEntryModal'
import * as Clipboard from 'expo-clipboard'
import { buildOutreachDraft, isOutreachAction } from './outreachHelpers'

const { width, height } = Dimensions.get('window')

const RESUMES = [
  { id: 'r1', title: 'Product Design V4', subtitle: 'Last edited 2d ago', content: 'EXPERIENCE\n\nSenior Product Designer | Tech Co.\n- Led design system overhaul\n- Increased conversion by 15%' },
  { id: 'r2', title: 'UX Engineer Specialist', subtitle: 'Last edited 5d ago', content: 'EXPERIENCE\n\nUX Engineer | Startup Inc.\n- Built accessible component library\n- Prototyped complex interactions with React Native' },
]

const COVER_LETTERS = [
  { id: 'c1', title: 'AI Generated Tailored', subtitle: 'Relevance: High • 300 words', content: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in this role. My background in...' },
  { id: 'c2', title: 'Standard Cover Letter', subtitle: 'General Purpose', content: 'To whom it may concern,\n\nPlease accept this letter and the enclosed resume as an expression of my interest...' },
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

type PipelineStatusFilter = 'All' | 'Applied' | 'Interview' | 'Interviewing' | 'Offer' | 'Target' | 'Not Interested'

type JobTrackerRouteParams = {
  initialStatus?: PipelineStatusFilter
  openAddJobModal?: boolean
}

type JobTrackerProps = {
  route?: {
    params?: JobTrackerRouteParams
  }
}

const PIPELINE_STATUSES: PipelineStatusFilter[] = [
  'All',
  'Applied',
  'Interview',
  'Interviewing',
  'Offer',
  'Target',
  'Not Interested',
]

export function JobTrackerScreen({ route }: JobTrackerProps = {}) {
  const navigation = useNavigation<any>()
  const { thisWeek, nextUp, recommendedJobs, filters, activeFilter, setFilter, updateJobStatus, updateJobNotes, addJob } = useJobTrackerStore()
  const { avatarUrl, customInterviewPreps = [] } = useUserProfileStore()
  const { roleTrack, targetRole, locationPreference } = useCareerSetupStore()
  const { balance: creditBalance, canAfford: canAffordCredit, spendCredits } = useCreditsStore()
  const applyCost = CREDIT_COSTS.aiApplicationSubmit
  const outreachCost = CREDIT_COSTS.outreachMessageGen
  const canAffordApply = canAffordCredit('aiApplicationSubmit')
  const canAffordOutreach = canAffordCredit('outreachMessageGen')
  const creditColor = creditBalance > 30 ? '#10b981' : creditBalance > 10 ? '#f59e0b' : '#ef4444'

  // Dynamic Filters based on user profile
  const userFilters = ['All Roles', roleTrack, targetRole || 'Senior Engineer', locationPreference].filter(Boolean) as string[]
  // Ensure "All Roles" is always first and unique
  const displayFilters = Array.from(new Set(['All Roles', ...userFilters]))

  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState<PipelineStatusFilter>('All')
  
  // Job Detail Modal State
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<JobEntry['status']>('Applied')
  const [disqualifyReason, setDisqualifyReason] = useState('')
  const [notes, setNotes] = useState('')
  const [statusUpdateNote, setStatusUpdateNote] = useState('')
  
  // Application Prep State
  const [selectedResume, setSelectedResume] = useState(RESUMES[0])
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(COVER_LETTERS[0])
  const [activeDropdown, setActiveDropdown] = useState<'resume' | 'coverLetter' | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{title: string, content: string} | null>(null)
  const [applyTab, setApplyTab] = useState<'simple' | 'advanced'>('simple')
  const [showAddJobModal, setShowAddJobModal] = useState(false)
  const [jobInputMode, setJobInputMode] = useState<'url' | 'text'>('url')
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [showCustomPrepModal, setShowCustomPrepModal] = useState(false)
  const [showOutreachDrawer, setShowOutreachDrawer] = useState(false)
  const [selectedOutreachJob, setSelectedOutreachJob] = useState<JobEntry | null>(null)
  const [outreachDraft, setOutreachDraft] = useState('')
  const initialStatus = route?.params?.initialStatus
  const openAddJobModalFromRoute = route?.params?.openAddJobModal === true

  const fillAnim = React.useRef(new Animated.Value(0)).current
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const isHoldStarted = React.useRef(false)

  // Restore modal when returning from other screens if job was selected
  useFocusEffect(
      useCallback(() => {
          if (selectedJob && !modalVisible) {
              setModalVisible(true)
          }
      }, [selectedJob, modalVisible])
  )

  useEffect(() => {
    if (!initialStatus || !PIPELINE_STATUSES.includes(initialStatus)) return
    setActiveStatus(initialStatus)
    setSearchQuery('')
    setFilter('All Roles')
    navigation.setParams?.({ initialStatus: undefined })
  }, [initialStatus, setFilter])

  useEffect(() => {
    if (!openAddJobModalFromRoute || showAddJobModal) return
    setShowAddJobModal(true)
    navigation.setParams?.({ openAddJobModal: undefined })
  }, [openAddJobModalFromRoute, showAddJobModal, navigation])

  const openJobDetails = (job: JobEntry) => {
      setShowOutreachDrawer(false)
      setSelectedOutreachJob(null)
      setSelectedJob(job)
      setModalVisible(true)
      setIsApplying(false)
      setIsUpdatingStatus(false)
      setNewStatus(job.status)
      setDisqualifyReason('')
      setNotes(job.notes || '')
      setStatusUpdateNote('')
      setActiveDropdown(null)
      // Reset selections to defaults or last used? Defaults for now.
      setSelectedResume(RESUMES[0])
      setSelectedCoverLetter(COVER_LETTERS[0])
      fillAnim.setValue(0)
  }

  const openOutreachDrawer = (job: JobEntry) => {
      setModalVisible(false)
      setSelectedJob(null)
      setIsApplying(false)
      setIsUpdatingStatus(false)
      setSelectedOutreachJob(job)
      setOutreachDraft('')
      setShowOutreachDrawer(true)
  }

  const closeOutreachDrawer = () => {
      setShowOutreachDrawer(false)
      setSelectedOutreachJob(null)
      setOutreachDraft('')
  }

  const handleJobPress = (job: JobEntry) => {
      if (isOutreachAction(job.nextAction)) {
          openOutreachDrawer(job)
          return
      }
      openJobDetails(job)
  }

  const closeJobDetails = () => {
      setModalVisible(false)
      setSelectedJob(null)
      setIsApplying(false)
      setIsUpdatingStatus(false)
      setStatusUpdateNote('')
      setActiveDropdown(null)
      setPreviewDoc(null)
      fillAnim.setValue(0)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      isHoldStarted.current = false
  }

  const handleGenerateOutreachDraft = () => {
      if (!selectedOutreachJob) return
      if (!canAffordOutreach) {
          Alert.alert(
            'Not enough credits',
            `Generating outreach drafts requires ${outreachCost} credits.`
          )
          return
      }

      const spent = spendCredits(
        'outreachMessageGen',
        `Outreach draft for ${selectedOutreachJob.company}`
      )
      if (!spent) {
          Alert.alert(
            'Not enough credits',
            `Generating outreach drafts requires ${outreachCost} credits.`
          )
          return
      }

      setOutreachDraft(buildOutreachDraft(selectedOutreachJob))
  }

  const handleCopyOutreachDraft = async () => {
      if (!outreachDraft.trim()) {
          Alert.alert('No draft yet', 'Generate a draft first before copying.')
          return
      }

      await Clipboard.setStringAsync(outreachDraft)
      Alert.alert('Copied', 'Outreach draft copied to clipboard.')
  }

  const handleMarkOutreachSent = () => {
      if (!selectedOutreachJob) return

      if (outreachDraft.trim()) {
        const previousNotes = selectedOutreachJob.notes?.trim() || ''
        const updatedNotes = [
          previousNotes,
          `[Outreach sent • ${new Date().toLocaleDateString()}]`,
          outreachDraft.trim(),
        ]
          .filter(Boolean)
          .join('\n\n')

        updateJobNotes(selectedOutreachJob.id, updatedNotes)
      }

      Alert.alert('Marked as sent', 'Outreach was logged for this role.')
      closeOutreachDrawer()
  }

  const handleUpdateStatus = () => {
      if (selectedJob) {
          const existingNotes = selectedJob.notes?.trim() || notes.trim()
          const trimmedReason = disqualifyReason.trim()
          const trimmedUpdateNote = statusUpdateNote.trim()
          const hasStatusChange = newStatus !== selectedJob.status

          if (hasStatusChange) {
            const statusUpdateEntry = [
              `[${new Date().toLocaleString()}] Status: ${selectedJob.status} -> ${newStatus}`,
              trimmedReason ? `Reason: ${trimmedReason}` : '',
              trimmedUpdateNote ? `Note: ${trimmedUpdateNote}` : '',
            ]
              .filter(Boolean)
              .join('\n')

            const mergedNotes = [existingNotes, statusUpdateEntry].filter(Boolean).join('\n\n')
            updateJobNotes(selectedJob.id, mergedNotes)
            setNotes(mergedNotes)
            updateJobStatus(selectedJob.id, newStatus)
            closeJobDetails()
            return
          }

          if (!trimmedUpdateNote) return

          const noteEntry = `[${new Date().toLocaleString()}] Note: ${trimmedUpdateNote}`
          const mergedNotes = [existingNotes, noteEntry].filter(Boolean).join('\n\n')
          updateJobNotes(selectedJob.id, mergedNotes)
          setNotes(mergedNotes)
          setSelectedJob({ ...selectedJob, notes: mergedNotes })
          setStatusUpdateNote('')
      }
  }

  const handleStandardApply = () => {
      if (!selectedJob) return
      updateJobStatus(selectedJob.id, 'Applied')
      closeJobDetails()
      Alert.alert('Applied!', `${selectedJob.role} at ${selectedJob.company} marked as Applied.`)
  }

  const handleHoldStart = () => {
      if (!canAffordApply) {
          Alert.alert('Insufficient Credits', `You need ${applyCost} credits for an AI application.`)
          return
      }

      Animated.timing(fillAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false
      }).start(({ finished }) => {
          if (finished && selectedJob) {
              spendCredits('aiApplicationSubmit', `AI Application for ${selectedJob.company}`)
              updateJobStatus(selectedJob.id, 'Applied')
              Alert.alert("Application Submitted", "Good luck! The AI has processed your application.")
              closeJobDetails()
          }
      })
  }

  const handleHoldEnd = () => {
      Animated.timing(fillAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false
      }).start()
  }

  const handleActionPressIn = () => {
      isHoldStarted.current = false
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      
      holdTimerRef.current = setTimeout(() => {
          isHoldStarted.current = true
          handleHoldStart()
      }, 300) // 300ms threshold for hold to start
  }

  const handleActionPressOut = () => {
      if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current)
          holdTimerRef.current = null
      }

      if (!isHoldStarted.current) {
          handleStandardApply()
      } else {
          handleHoldEnd()
      }
  }

  const fillWidth = fillAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
  })

  // Combine all active jobs
  const allActiveJobs = [...thisWeek, ...nextUp]

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const doesJobMatchSearch = (job: JobEntry) =>
    normalizedQuery.length === 0 ||
    job.role.toLowerCase().includes(normalizedQuery) ||
    job.company.toLowerCase().includes(normalizedQuery)

  const doesJobMatchStatus = (
    job: JobEntry,
    status: PipelineStatusFilter
  ) => {
    if (status === 'All') return true
    if (status === 'Offer') return job.status.includes('Offer')
    if (status === 'Interview' || status === 'Interviewing') {
      return job.status === 'Interview' || job.status === 'Interviewing'
    }
    return job.status === status
  }

  const doesJobMatchRoleFilter = (job: JobEntry, filter: string) => {
    if (filter === 'All Roles') return true

    const lowerFilter = filter.toLowerCase()
    const lowerRole = job.role.toLowerCase()
    const matchesTag = job.tags?.some(tag => tag.toLowerCase() === lowerFilter) ?? false

    let matchesRole = lowerRole.includes(lowerFilter) || matchesTag

    if (lowerFilter === 'product design') {
      matchesRole = matchesRole || lowerRole.includes('designer')
    }
    if (lowerFilter === 'engineering') {
      matchesRole = matchesRole || lowerRole.includes('engineer') || lowerRole.includes('developer')
    }

    return matchesRole
  }

  const displayedJobs = allActiveJobs.filter(
    job => doesJobMatchSearch(job) && doesJobMatchStatus(job, activeStatus) && doesJobMatchRoleFilter(job, activeFilter)
  )
  const isFiltering = activeStatus !== 'All' || normalizedQuery.length > 0 || activeFilter !== 'All Roles'

  // Counts should reflect current search + role filter context, independent of active status selection.
  const statusCountBase = allActiveJobs.filter(job => doesJobMatchSearch(job) && doesJobMatchRoleFilter(job, activeFilter))
  const appliedCount = statusCountBase.filter(j => j.status === 'Applied').length
  const interviewCount = statusCountBase.filter(j => j.status === 'Interview' || j.status === 'Interviewing').length
  const offerCount = statusCountBase.filter(j => j.status.includes('Offer')).length
  const savedCount = statusCountBase.filter(j => j.status === 'Target').length

  const filterCounts = Object.fromEntries(
    displayFilters.map(filter => [
      filter,
      allActiveJobs.filter(
        job => doesJobMatchSearch(job) && doesJobMatchStatus(job, activeStatus) && doesJobMatchRoleFilter(job, filter)
      ).length,
    ])
  ) as Record<string, number>
  const hasStatusChange = !!selectedJob && newStatus !== selectedJob.status
  const hasUpdateNote = statusUpdateNote.trim().length > 0
  const updateActionLabel = hasStatusChange
    ? (hasUpdateNote ? 'Save Update & Note' : 'Save Update')
    : (hasUpdateNote ? 'Save Note' : 'Save Update')

  const handleStatusPress = (status: PipelineStatusFilter) => {
      if (activeStatus === status && status !== 'All') {
          setActiveStatus('All')
      } else {
          setActiveStatus(status)
      }
  }

  const handleStartCustomInterviewPrep = () => {
    setShowCustomPrepModal(true)
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
    setSearchQuery('')
    setActiveStatus('All')
    setFilter('All Roles')
    closeAddJobModal()
    Alert.alert('Added to pipeline', `${importedJob.role} at ${importedJob.company} was added.`)
  }

  const renderStatCard = (label: string, count: number, status: 'Applied' | 'Interview' | 'Interviewing' | 'Offer' | 'Target' | 'Not Interested', color: string) => {
      const isActive = activeStatus === status
      return (
      <TouchableOpacity 
          style={[
              styles.statCard, 
              isActive && { backgroundColor: color, borderColor: color }
          ]}
          onPress={() => handleStatusPress(status)}
          activeOpacity={0.7}
      >
          <Text style={[styles.statLabel, isActive && { color: 'rgba(255,255,255,0.8)' }]}>{label}</Text>
          <Text style={[styles.statCount, { color: isActive ? '#fff' : color }]}>{count}</Text>
      </TouchableOpacity>
      )
  }

  const getSectionTitle = () => {
      if (activeStatus === 'Applied') return 'Applied Jobs'
      if (activeStatus === 'Interview' || activeStatus === 'Interviewing') return 'Interviews'
      if (activeStatus === 'Offer') return 'Offers'
      if (activeStatus === 'Target') return 'Saved Jobs'
      if (activeStatus === 'Not Interested') return 'Archived Jobs'
      if (searchQuery) return 'Search Results'
      return 'Active Applications'
  }

  const renderDocumentSelector = (
    type: 'resume' | 'coverLetter',
    selected: typeof RESUMES[0],
    options: typeof RESUMES,
    onSelect: (item: any) => void
  ) => {
      const isOpen = activeDropdown === type
      
      return (
          <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{type === 'resume' ? 'Resume' : 'Cover Letter'}</Text>
              
              {!isOpen ? (
                 <View style={styles.selectorRow}>
                    <TouchableOpacity 
                        style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12}}
                        onPress={() => setActiveDropdown(type)}
                    >
                        <View style={styles.iconCircle}>
                            <Feather name={type === 'resume' ? "file-text" : "file"} size={18} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.selectorTitle}>{selected.title}</Text>
                            <Text style={styles.selectorSub}>{selected.subtitle}</Text>
                        </View>
                    </TouchableOpacity>
                    
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <TouchableOpacity 
                            onPress={() => Alert.alert('Downloading', `Downloading ${selected.title}...`)} 
                            style={{padding: 4}}
                        >
                            <Feather name="download" size={20} color={CLTheme.text.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPreviewDoc(selected)} style={{padding: 4}}>
                            <Feather name="eye" size={20} color={CLTheme.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveDropdown(type)}>
                             <Feather name="chevron-down" size={20} color={CLTheme.text.muted} />
                        </TouchableOpacity>
                    </View>
                 </View>
              ) : (
                  <View style={styles.dropdownContainer}>
                      {options.map(item => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={[
                                styles.selectorRow, 
                                { borderBottomWidth: 1, borderBottomColor: CLTheme.border, marginBottom: 0, borderRadius: 0 },
                                item.id === selected.id && { backgroundColor: CLTheme.card }
                            ]}
                            onPress={() => {
                                onSelect(item)
                                setActiveDropdown(null)
                            }}
                          >
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                    <View style={[styles.iconCircle, item.id !== selected.id && { backgroundColor: CLTheme.border }]}>
                                        <Feather name={type === 'resume' ? "file-text" : "file"} size={18} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={styles.selectorTitle}>{item.title}</Text>
                                        <Text style={styles.selectorSub}>{item.subtitle}</Text>
                                    </View>
                                </View>
                                {item.id === selected.id && <Feather name="check" size={20} color={CLTheme.accent} />}
                          </TouchableOpacity>
                      ))}
                      <TouchableOpacity 
                        style={{padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: CLTheme.border}}
                        onPress={() => setActiveDropdown(null)}
                      >
                          <Feather name="chevron-up" size={20} color={CLTheme.text.muted} />
                      </TouchableOpacity>
                  </View>
              )}
          </View>
      )
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
          <Text style={styles.pageTitle}>My Pipeline</Text>
          <View style={styles.headerRight}>
             <Text style={styles.activeCountLabel}>{allActiveJobs.length} active</Text>
             <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('SettingsProfile')}>
                 <Image source={{uri: avatarUrl || 'https://i.pravatar.cc/150?u=user'}} style={styles.avatarImg} />
             </TouchableOpacity>
          </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
              {renderStatCard('Applied', appliedCount, 'Applied', '#3b82f6')} 
              {renderStatCard('Interviewing', interviewCount, 'Interview', CLTheme.accent)}
              {renderStatCard('Offers', offerCount, 'Offer', '#10b981')}
              {renderStatCard('Saved', savedCount, 'Target', '#f97316')}
          </View>

          {/* Search & Filters */}
          <View style={styles.controlsSection}>
              <View style={styles.searchContainer}>
                  <Feather name="search" size={18} color={CLTheme.text.muted} style={{marginRight: 10}} />
                  <TextInput 
                      placeholder="Search pipeline..." 
                      placeholderTextColor={CLTheme.text.muted}
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                  />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {displayFilters.map(filter => (
                      <TouchableOpacity 
                          key={filter}
                          style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                          onPress={() => setFilter(filter)}
                      >
                          <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                            {filter} ({filterCounts[filter]})
                          </Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Custom Interview Prep</Text>
          </View>
          <View style={styles.customPrepSection}>
            <TouchableOpacity style={styles.customPrepStartButton} onPress={handleStartCustomInterviewPrep}>
              <View style={styles.customPrepStartLeft}>
                <View style={styles.customPrepStartIcon}>
                  <Feather name="file-plus" size={16} color={CLTheme.accent} />
                </View>
                <View>
                  <Text style={styles.customPrepStartTitle}>Start Custom Interview Prep</Text>
                  <Text style={styles.customPrepStartSubtitle}>Paste a JD URL or full job description</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={CLTheme.text.secondary} />
            </TouchableOpacity>

            {customInterviewPreps.length === 0 ? (
              <Text style={styles.customPrepEmptyText}>
                No custom preps yet. Start one above and it will appear here.
              </Text>
            ) : (
              <View style={styles.customPrepList}>
                {customInterviewPreps.slice(0, 3).map(prep => (
                  <TouchableOpacity
                    key={prep.id}
                    style={styles.customPrepItem}
                    onPress={() => navigation.navigate('InterviewPrep', { customPrep: prep })}
                  >
                    <View style={[styles.logoBoxSmall, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Feather name="check-circle" size={15} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customPrepItemRole}>{prep.inferredRole}</Text>
                      <Text style={styles.customPrepItemMeta}>
                        {prep.companyName || 'Custom role'} • {new Date(prep.savedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={CLTheme.text.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Recommended Jobs Slider */}
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Recommended For You</Text>
             <TouchableOpacity onPress={() => navigation.navigate('RecommendedJobs')}>
                 <Text style={styles.seeAllText}>See All</Text>
             </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll} contentContainerStyle={{paddingRight: 20}}>
              {recommendedJobs.slice(0, 3).map(job => (
                  <TouchableOpacity key={job.id} style={styles.recCard} activeOpacity={0.8} onPress={() => handleJobPress(job)}>
                      <View style={styles.recHeader}>
                         <View style={[styles.logoBoxSmall, { backgroundColor: job.color || '#f0f0f0' }]}>
                             {job.logo ? (
                                 <Image source={{uri: job.logo}} style={styles.logoImage} resizeMode="cover" />
                             ) : (
                                 <Text style={styles.logoTextSmall}>{job.company.charAt(0)}</Text>
                             )}
                         </View>
                         <View style={styles.recBadge}>
                             <Text style={styles.recMatch}>{job.match} Match</Text>
                         </View>
                      </View>
                      <Text style={styles.recRole} numberOfLines={1}>{job.role}</Text>
                      <Text style={styles.recCompany}>{job.company}</Text>
                  </TouchableOpacity>
              ))}
          </ScrollView>

          {/* Conditional Rendering */}
          {!isFiltering ? (
            <>
               <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>This Week</Text>
                </View>
                <View style={styles.list}>
                    {thisWeek.map(job => (
                        <TouchableOpacity key={job.id} activeOpacity={0.9} onPress={() => handleJobPress(job)}>
                            {renderJobCard(job)}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Next Up</Text>
                </View>
                <View style={styles.list}>
                    {nextUp.map(job => (
                        <TouchableOpacity key={job.id} activeOpacity={0.9} onPress={() => handleJobPress(job)}>
                            {renderJobCard(job)}
                        </TouchableOpacity>
                    ))}
                </View>
            </>
          ) : (
            <>
               <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                   <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
                   <Text style={styles.countBadge}>{displayedJobs.length}</Text>
               </View>
               <View style={styles.list}>
                   {displayedJobs.map(job => (
                       <TouchableOpacity key={job.id} activeOpacity={0.9} onPress={() => handleJobPress(job)}>
                           {renderJobCard(job)}
                       </TouchableOpacity>
                   ))}
                   {displayedJobs.length === 0 && (
                       <View style={styles.emptyState}>
                           <Text style={styles.emptyText}>No jobs found matching your filters.</Text>
                       </View>
                   )}
               </View>
            </>
          )}

          <View style={{height: 100}} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAddJobModal} testID='tracker-add-job-fab'>
          <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showAddJobModal} animationType='slide' transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { height: '62%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Import Job Description</Text>
                      <TouchableOpacity onPress={closeAddJobModal} style={styles.closeBtn}>
                          <Feather name='x' size={24} color={CLTheme.text.primary} />
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
          </View>
      </Modal>

      <CustomPrepEntryModal
        visible={showCustomPrepModal}
        onClose={() => setShowCustomPrepModal(false)}
        onSubmit={(customPrep) => {
          setShowCustomPrepModal(false)
          navigation.navigate('InterviewPrep', { customPrep })
        }}
      />

      <Modal visible={showOutreachDrawer} animationType='slide' transparent>
          <View style={styles.outreachOverlay}>
              <TouchableOpacity style={styles.outreachBackdrop} activeOpacity={1} onPress={closeOutreachDrawer} />
              <View style={styles.outreachSheet}>
                  <View style={styles.outreachHandle} />
                  <View style={styles.outreachHeaderRow}>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={styles.outreachTitle}>Draft Outreach Message</Text>
                          <Text style={styles.outreachSubtitle}>
                              {selectedOutreachJob?.role} • {selectedOutreachJob?.company}
                          </Text>
                          <Text style={styles.outreachMeta}>
                              {selectedOutreachJob?.nextAction || 'Follow-up email / test'}
                          </Text>
                      </View>
                      <TouchableOpacity onPress={closeOutreachDrawer} style={styles.closeBtn}>
                          <Feather name='x' size={22} color={CLTheme.text.secondary} />
                      </TouchableOpacity>
                  </View>

                  <View style={styles.creditCostRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Feather name='zap' size={14} color={creditColor} />
                          <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
                      </View>
                      <Text style={styles.creditEstimate}>Generate: ~{outreachCost} credits</Text>
                  </View>

                  <View style={styles.outreachEditorCard}>
                      <Text style={styles.outreachEditorLabel}>Message Preview</Text>
                      <TextInput
                        style={styles.outreachTextarea}
                        value={outreachDraft}
                        onChangeText={setOutreachDraft}
                        multiline
                        textAlignVertical='top'
                        placeholder='Generate an AI follow-up message, then edit before copying.'
                        placeholderTextColor={CLTheme.text.muted}
                      />
                  </View>

                  <View style={styles.outreachActionRow}>
                      <TouchableOpacity
                        style={[styles.outreachGenerateBtn, !canAffordOutreach && { opacity: 0.45 }]}
                        onPress={handleGenerateOutreachDraft}
                        disabled={!canAffordOutreach}
                        testID='tracker-outreach-generate'
                      >
                        <Feather name='zap' size={16} color='#fff' />
                        <Text style={styles.outreachGenerateBtnText}>Generate</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.outreachCopyBtn}
                        onPress={handleCopyOutreachDraft}
                        testID='tracker-outreach-copy'
                      >
                        <Feather name='copy' size={16} color={CLTheme.accent} />
                        <Text style={styles.outreachCopyBtnText}>Copy</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.outreachMarkSentBtn}
                        onPress={handleMarkOutreachSent}
                        testID='tracker-outreach-mark-sent'
                      >
                        <Feather name='check-circle' size={18} color='#fff' />
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
      
      {/* Job Details Modal - Keeping it simple for now, can be expanded */}
      <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <View style={{width: 40}} /> 
                      <Text style={styles.modalTitle}>Job Details</Text>
                      <TouchableOpacity onPress={closeJobDetails} style={styles.closeBtn}>
                          <Feather name="x" size={24} color={CLTheme.text.primary} />
                      </TouchableOpacity>
                  </View>
                  
                  {selectedJob && (
                      <ScrollView contentContainerStyle={{padding: 20}}>
                          {!isApplying && !isUpdatingStatus ? (
                              <View>
                                <View style={{alignItems: 'center', marginBottom: 24}}>
                                      <View style={[styles.logoBoxLarge, { backgroundColor: selectedJob.color || '#f1f5f9' }]}>
                                          {selectedJob.logo ? (
                                              <Image source={{ uri: selectedJob.logo }} style={styles.logoImage} resizeMode="contain" />
                                          ) : (
                                              <Text style={styles.logoTextLarge}>{selectedJob.company.charAt(0)}</Text>
                                          )}
                                      </View>
                                      <Text style={styles.detailRole}>{selectedJob.role}</Text>
                                      <Text style={styles.detailCompany}>{selectedJob.company} • {selectedJob.location}</Text>
                                      
                                      <View style={[
                                          styles.statusBadge, 
                                          { marginTop: 12, borderColor: getStatusColor(selectedJob.status) },
                                          selectedJob.status === 'Offer Signed' && { backgroundColor: '#059669', borderColor: '#059669' }
                                      ]}>
                                          <Text style={[
                                              styles.statusText, 
                                              { color: getStatusColor(selectedJob.status) },
                                              selectedJob.status === 'Offer Signed' && { color: '#fff' }
                                          ]}>{selectedJob.status}</Text>
                                      </View>
                                </View>

                                <View style={styles.detailSection}>
                                      <Text style={styles.detailLabel}>Next Action</Text>
                                      <View style={styles.actionRow}>
                                          <Feather name={getActionIcon(selectedJob.nextAction)} size={20} color={CLTheme.text.primary} />
                                          <Text style={styles.actionText}>{selectedJob.nextAction}</Text>
                                      </View>
                                      <Text style={styles.actionDate}>Due: {selectedJob.nextActionDate}</Text>
                                </View>
                                
                                <View style={styles.detailSection}>
                                      <Text style={styles.detailLabel}>Notes</Text>
                                      <TextInput
                                          style={styles.notesInput}
                                          placeholder="Add notes..."
                                          placeholderTextColor={CLTheme.text.muted}
                                          value={notes}
                                          onChangeText={setNotes}
                                          onEndEditing={() => updateJobNotes(selectedJob.id, notes)}
                                          multiline
                                      />
                                </View>

                                 {selectedJob.status === 'Target' ? (
                                    <View>
                                        <TouchableOpacity 
                                            style={[styles.primaryBtn, { marginBottom: 12 }]} 
                                            onPress={() => setIsApplying(true)}
                                        >
                                            <Text style={styles.primaryBtnText}>Submit Application</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[
                                                styles.primaryBtn, 
                                                { 
                                                    marginTop: 0, 
                                                    backgroundColor: 'transparent', 
                                                    borderWidth: 1, 
                                                    borderColor: CLTheme.border, 
                                                    paddingVertical: 14 
                                                }
                                            ]} 
                                            onPress={() => setIsUpdatingStatus(true)}
                                        >
                                            <Text style={[styles.primaryBtnText, { color: CLTheme.text.primary }]}>Update Status</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (selectedJob.status === 'Interview' || selectedJob.status === 'Interviewing') ? (
                                    <View>
                                        <TouchableOpacity 
                                            style={[styles.primaryBtn, { marginBottom: 12 }]} 
                                            onPress={() => {
                                                setModalVisible(false) // Temporarily hide modal
                                                navigation.navigate('InterviewPrep', { job: selectedJob })
                                            }}
                                        >
                                            <Text style={styles.primaryBtnText}>Practice Interview</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[
                                                styles.primaryBtn, 
                                                { 
                                                    marginTop: 0, // Remove default top margin
                                                    backgroundColor: 'transparent', 
                                                    borderWidth: 1, 
                                                    borderColor: CLTheme.border, 
                                                    paddingVertical: 14 
                                                }
                                            ]} 
                                            onPress={() => setIsUpdatingStatus(true)}
                                        >
                                            <Text style={[styles.primaryBtnText, { color: CLTheme.text.primary }]}>Update Status</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                      <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsUpdatingStatus(true)}>
                                          <Text style={styles.primaryBtnText}>Update Status</Text>
                                      </TouchableOpacity>
                                  )}

                                  {/* Special Actions for Offer */}
                                   {selectedJob.status.includes('Offer') && (
                                      <View style={{marginTop: 12, padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12}}>
                                          <Text style={{color: '#059669', fontWeight: '600', textAlign: 'center'}}>
                                              {selectedJob.status === 'Offer Signed' ? '🎉 Offer Signed! Congratulations!' : '🎉 Offer Received!'}
                                          </Text>
                                      </View>
                                   )}
                              </View>
                            ) : isUpdatingStatus ? (
                              <View style={styles.applyContainer}>
                                  <Text style={styles.applyHeader}>Update Status</Text>
                                  
                                  <View style={{gap: 12}}>
                                      {(['Applied', 'Interviewing', 'Offer Received', 'Offer Signed', 'Rejected', 'Not Interested'] as const)
                                        .filter(s => s !== selectedJob.status)
                                        .map((status) => (
                                          <TouchableOpacity 
                                              key={status}
                                              style={[
                                                  styles.statusOption, 
                                                  newStatus === status && styles.statusOptionActive,
                                                  newStatus === status && { borderColor: getStatusColor(status) }
                                              ]}
                                              onPress={() => setNewStatus(status)}
                                          >
                                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                                  <View style={[
                                                      styles.statusDot, 
                                                      { backgroundColor: getStatusColor(status) }
                                                  ]} />
                                                  <Text style={[
                                                      styles.statusOptionText,
                                                      newStatus === status && { color: CLTheme.text.primary }
                                                  ]}>{status}</Text>
                                              </View>
                                              {newStatus === status && (
                                                  <Feather name="check" size={20} color={getStatusColor(status)} />
                                              )}
                                          </TouchableOpacity>
                                      ))}
                                  </View>

                                  {(newStatus === 'Rejected' || newStatus === 'Not Interested') && (
                                      <View style={{marginTop: 20}}>
                                          <Text style={styles.detailLabel}>{newStatus === 'Rejected' ? 'Reason (Optional)' : 'Why not interested?'}</Text>
                                          <TextInput 
                                              style={styles.reasonInput}
                                              placeholder={newStatus === 'Rejected' ? "Why was it rejected? (e.g. Salary, Role fit)" : "Share your reason..."}
                                              placeholderTextColor={CLTheme.text.muted}
                                              value={disqualifyReason}
                                              onChangeText={setDisqualifyReason}
                                              multiline
                                          />
                                      </View>
                                  )}

                                  <View style={{marginTop: 16}}>
                                      <Text style={styles.detailLabel}>Update Note (Optional)</Text>
                                      <TextInput
                                          style={styles.updateNoteInput}
                                          placeholder='Add a quick update note for this status change...'
                                          placeholderTextColor={CLTheme.text.muted}
                                          value={statusUpdateNote}
                                          onChangeText={setStatusUpdateNote}
                                          multiline
                                          textAlignVertical='top'
                                      />
                                  </View>

                                  <TouchableOpacity 
                                      style={[styles.primaryBtn, {marginBottom: 16}]} 
                                      onPress={handleUpdateStatus}
                                  >
                                      <Text style={styles.primaryBtnText}>{updateActionLabel}</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                      style={{alignItems: 'center'}}
                                      onPress={() => {
                                          setIsUpdatingStatus(false)
                                          setStatusUpdateNote('')
                                      }}
                                  >
                                      <Text style={{color: CLTheme.text.muted}}>Cancel</Text>
                                  </TouchableOpacity>
                              </View>
                          ) : (
                              <View style={styles.applyContainer}>
                                  {/* Header */}
                                  <View style={styles.applyTitleRow}>
                                    <Text style={styles.applyHeader}>Prepare Application</Text>
                                    <TouchableOpacity onPress={() => setIsApplying(false)} style={{padding: 4}}>
                                      <MaterialIcons name='close' size={20} color='#94a3b8' />
                                    </TouchableOpacity>
                                  </View>

                                  {/* Tab Switcher */}
                                  <View style={styles.applyTabBar}>
                                    <TouchableOpacity
                                      style={[styles.applyTab, applyTab === 'simple' && styles.applyTabActive]}
                                      onPress={() => setApplyTab('simple')}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={[styles.applyTabText, applyTab === 'simple' && styles.applyTabTextActive]}>Simple</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.applyTab, applyTab === 'advanced' && styles.applyTabActive]}
                                      onPress={() => setApplyTab('advanced')}
                                      activeOpacity={0.8}
                                    >
                                      <Text style={[styles.applyTabText, applyTab === 'advanced' && styles.applyTabTextActive]}>Advanced</Text>
                                    </TouchableOpacity>
                                  </View>

                                  {applyTab === 'simple' ? (
                                    <>
                                      <Text style={styles.applySubheader}>Select your resume and cover letter to apply.</Text>
                                      {renderDocumentSelector('resume', selectedResume, RESUMES, setSelectedResume)}
                                      {renderDocumentSelector('coverLetter', selectedCoverLetter, COVER_LETTERS, setSelectedCoverLetter)}

                                      {/* AI Generate Buttons */}
                                      <View style={{flexDirection: 'row', gap: 10, marginTop: 14}}>
                                        <TouchableOpacity
                                          style={styles.aiGenBtn}
                                          onPress={() => {
                                            if (canAffordCredit('resumeTailor')) {
                                              spendCredits('resumeTailor', `Tailored resume for ${selectedJob?.company || 'job'}`)
                                              Alert.alert('Resume Generated', `AI-tailored resume created for ${selectedJob?.role || 'this role'}.\nCost: ${CREDIT_COSTS.resumeTailor} credits`)
                                            } else {
                                              Alert.alert('Insufficient Credits', `You need ${CREDIT_COSTS.resumeTailor} credits to generate a resume.`)
                                            }
                                          }}
                                        >
                                          <Feather name="cpu" size={14} color="#0d6cf2" />
                                          <Text style={styles.aiGenBtnText}>AI Resume ({CREDIT_COSTS.resumeTailor}cr)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.aiGenBtn}
                                          onPress={() => {
                                            if (canAffordCredit('coverLetterGen')) {
                                              spendCredits('coverLetterGen', `Cover letter for ${selectedJob?.company || 'job'}`)
                                              Alert.alert('Cover Letter Generated', `AI cover letter created for ${selectedJob?.role || 'this role'}.\nCost: ${CREDIT_COSTS.coverLetterGen} credits`)
                                            } else {
                                              Alert.alert('Insufficient Credits', `You need ${CREDIT_COSTS.coverLetterGen} credits to generate a cover letter.`)
                                            }
                                          }}
                                        >
                                          <Feather name="cpu" size={14} color="#0d6cf2" />
                                          <Text style={styles.aiGenBtnText}>AI Cover ({CREDIT_COSTS.coverLetterGen}cr)</Text>
                                        </TouchableOpacity>
                                      </View>

                                      {/* ── Action Area ── */}
                                      <View style={{marginTop: 28, gap: 16}}>
                                        <View style={{gap: 8}}>
                                          <View style={styles.creditCostRow}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                              <Feather name="zap" size={14} color={creditColor} />
                                              <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
                                            </View>
                                            <Text style={styles.creditEstimate}>{applyCost}cr for AI features</Text>
                                          </View>
                                          
                                          <Pressable
                                            onPressIn={handleActionPressIn}
                                            onPressOut={handleActionPressOut}
                                            style={({ pressed }) => [
                                              styles.holdBtnContainer,
                                              { backgroundColor: pressed ? '#1e293b' : '#334155' },
                                              !canAffordApply && { opacity: 0.8 } // Show as active since tap is free
                                            ]}
                                          >
                                            <Animated.View style={[styles.holdFill, { width: fillWidth }]} />
                                            <View style={styles.holdContent}>
                                              <Feather name="send" size={20} color="#fff" style={{marginRight: 8}} />
                                              <Text style={styles.holdText}>Applying with AI...</Text>
                                            </View>
                                            <View style={{position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8}}>
                                              <Text style={[styles.holdText, {opacity: 1}]}>Tap to Apply • Hold for AI</Text>
                                            </View>
                                          </Pressable>
                                          
                                          <Text style={{fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4}}>
                                            AI application includes tailored resume & cover letter
                                          </Text>
                                        </View>
                                      </View>
                                    </>
                                  ) : (
                                    /* ====== Advanced Tab ====== */
                                    <View style={{gap: 20}}>
                                      {/* Job Context Card */}
                                      {selectedJob && (
                                        <View style={styles.advJobCard}>
                                          <View style={[styles.advLogoBox, { backgroundColor: selectedJob.color || '#1e293b' }]}>
                                            {selectedJob.logo
                                              ? <Image source={{ uri: selectedJob.logo }} style={styles.advLogoImage} resizeMode='contain' />
                                              : <Text style={styles.advLogoFallback}>{selectedJob.company.charAt(0)}</Text>
                                            }
                                          </View>
                                          <View style={{flex: 1}}>
                                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                              <Text style={styles.advJobTitle} numberOfLines={1}>{selectedJob.role}</Text>
                                              <View style={{backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                                                <Text style={{color: '#10b981', fontSize: 11, fontWeight: '600'}}>{selectedJob.match ?? '94%'} Match</Text>
                                              </View>
                                            </View>
                                            <Text style={styles.advCompanyLoc}>{selectedJob.company} • {selectedJob.location}</Text>
                                          </View>
                                        </View>
                                      )}

                                      {/* Resume Selector */}
                                      <View>
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                          <Text style={styles.advSectionTitle}>TAILORED RESUME</Text>
                                          <TouchableOpacity
                                            style={styles.aiGenBtnSmall}
                                            onPress={() => {
                                              if (canAffordCredit('resumeTailor')) {
                                                spendCredits('resumeTailor', `Tailored resume for ${selectedJob?.company || 'job'}`)
                                                Alert.alert('Resume Generated', `AI-tailored resume created.\nCost: ${CREDIT_COSTS.resumeTailor} credits`)
                                              } else {
                                                Alert.alert('Insufficient Credits', `Need ${CREDIT_COSTS.resumeTailor} credits.`)
                                              }
                                            }}
                                          >
                                            <Feather name="cpu" size={12} color="#0d6cf2" />
                                            <Text style={{color: '#0d6cf2', fontSize: 11, fontWeight: '600'}}>Generate ({CREDIT_COSTS.resumeTailor}cr)</Text>
                                          </TouchableOpacity>
                                        </View>
                                        {renderDocumentSelector('resume', selectedResume, RESUMES, setSelectedResume)}
                                      </View>

                                      {/* Cover Letter Selector */}
                                      <View>
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                          <Text style={styles.advSectionTitle}>COVER NOTE</Text>
                                          <TouchableOpacity
                                            style={styles.aiGenBtnSmall}
                                            onPress={() => {
                                              if (canAffordCredit('coverLetterGen')) {
                                                spendCredits('coverLetterGen', `Cover letter for ${selectedJob?.company || 'job'}`)
                                                Alert.alert('Cover Letter Generated', `AI cover letter created.\nCost: ${CREDIT_COSTS.coverLetterGen} credits`)
                                              } else {
                                                Alert.alert('Insufficient Credits', `Need ${CREDIT_COSTS.coverLetterGen} credits.`)
                                              }
                                            }}
                                          >
                                            <Feather name="cpu" size={12} color="#0d6cf2" />
                                            <Text style={{color: '#0d6cf2', fontSize: 11, fontWeight: '600'}}>Generate ({CREDIT_COSTS.coverLetterGen}cr)</Text>
                                          </TouchableOpacity>
                                        </View>
                                        {renderDocumentSelector('coverLetter', selectedCoverLetter, COVER_LETTERS, setSelectedCoverLetter)}
                                      </View>

                                      {/* Suggested Answers */}
                                      <View>
                                        <Text style={[styles.advSectionTitle, {marginBottom: 10}]}>SUGGESTED ANSWERS</Text>
                                        {[
                                          { q: 'Why do you want to work here?', a: selectedJob ? `I've always admired ${selectedJob.company}'s work in this space. My background aligns strongly with this ${selectedJob.role} role.` : '' },
                                          { q: 'Salary Expectations?', a: '$180k - $210k base salary', mono: true },
                                          { q: 'Notice Period?', a: 'Available to start immediately.' },
                                        ].map((item, idx) => (
                                          <View key={idx} style={[styles.advAnswerCard, {marginBottom: 8}]}>
                                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                              <Text style={[styles.advQuestionText, {color: '#60a5fa', flex: 1}]}>{item.q}</Text>
                                              <TouchableOpacity
                                                style={{padding: 4}}
                                                onPress={async () => {
                                                  await Clipboard.setStringAsync(item.a)
                                                  Alert.alert('Copied', 'Answer copied to clipboard')
                                                }}
                                              >
                                                <MaterialIcons name='content-copy' size={16} color='#64748b' />
                                              </TouchableOpacity>
                                            </View>
                                            <Text style={[styles.advAnswerText, item.mono && {fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start'}]}>{item.a}</Text>
                                          </View>
                                        ))}
                                      </View>

                                      {/* Footer: Info hint + CTA */}
                                      <View style={{gap: 10}}>
                                        <View style={styles.creditCostRow}>
                                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                            <Feather name="zap" size={14} color={creditColor} />
                                            <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
                                          </View>
                                          <Text style={styles.creditEstimate}>Est. cost: ~{applyCost} credits</Text>
                                        </View>
                                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4}}>
                                          <MaterialIcons name='info-outline' size={14} color='#f59e0b' />
                                          <Text style={{fontSize: 12, color: '#94a3b8'}}>Remember to attach the PDF manually!</Text>
                                        </View>
                                        <TouchableOpacity
                                          style={styles.advCTABtn}
                                          onPress={() => {
                                            if (canAffordApply) {
                                              spendCredits('aiApplicationSubmit', `Applied to ${selectedJob?.company || 'job'} — ${selectedJob?.role || 'role'}`)
                                              if (selectedJob) updateJobStatus(selectedJob.id, 'Applied')
                                              setIsApplying(false)
                                              Alert.alert('Application Logged!', `${selectedJob?.role || 'Job'} at ${selectedJob?.company || 'Company'} marked as Applied.`)
                                            } else {
                                              Alert.alert('Insufficient Credits', `You need ${applyCost} credits to submit.`)
                                            }
                                          }}
                                        >
                                          <MaterialIcons name='check-circle' size={20} color='#fff' />
                                          <Text style={{color: '#fff', fontSize: 15, fontWeight: '700'}}>Approve & Log Submission</Text>
                                        </TouchableOpacity>
                                        {!canAffordApply && <Text style={styles.creditWarning}>Not enough credits</Text>}
                                      </View>
                                    </View>
                                  )}

                                  <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={() => setIsApplying(false)}>
                                    <Text style={{color: CLTheme.text.muted}}>Cancel</Text>
                                  </TouchableOpacity>
                              </View>
                          )}
                      </ScrollView>
                  )}
              </View>
          </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal visible={!!previewDoc} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{previewDoc?.title}</Text>
                      <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.closeBtn}>
                          <Feather name="x" size={24} color={CLTheme.text.primary} />
                      </TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{padding: 20}}>
                      <Text style={{color: CLTheme.text.primary, fontSize: 16, lineHeight: 24}}>
                          {previewDoc?.content}
                      </Text>
                  </ScrollView>
              </View>
          </View>
      </Modal>

    </View>
  )
}

const renderJobCard = (job: JobEntry) => {
    return (
        <View style={[styles.card, job.status.includes('Offer') && styles.offerCard]}>
            <View style={{left: 0, top: 12, bottom: 12, width: 4, position: 'absolute', backgroundColor: getStatusColor(job.status), borderTopRightRadius: 4, borderBottomRightRadius: 4}} />
            
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingLeft: 12}}>
            <View style={{flexDirection:'row', gap: 12, flex: 1}}>
                <View style={[styles.logoBox, { backgroundColor: job.color || '#f1f5f9' }]}>
                    {job.logo ? (
                        <Image source={{ uri: job.logo }} style={styles.logoImage} resizeMode="contain" />
                    ) : (
                    <Text style={styles.logoText}>{job.company.charAt(0)}</Text>
                    )}
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.roleText}>{job.role}</Text>
                    <Text style={styles.companyText}>{job.company} • {job.location}</Text>
                </View>
            </View>
            <View style={[
                styles.statusBadge, 
                job.status.includes('Offer') ? styles.statusBadgeOffer : { borderColor: getStatusColor(job.status) },
                job.status === 'Offer Signed' && { backgroundColor: '#059669', borderColor: '#059669' }
            ]}>
                <Text style={[
                    styles.statusText, 
                    job.status.includes('Offer') ? { color: '#fff' } : { color: getStatusColor(job.status) }
                ]}>{job.status === 'Target' ? 'Saved' : job.status}</Text>
            </View>
            </View>
            
            {/* Action Footer */}
            <View style={styles.actionFooter}>
            <View style={styles.nextActionBox}>
                <Feather name={getActionIcon(job.nextAction)} size={14} color={job.isOverdue ? '#ef4444' : CLTheme.text.muted} />
                <Text style={[styles.actionLabel, job.isOverdue && { color: '#ef4444' }]}>
                    {job.nextAction}
                </Text>
            </View>
             <View style={[styles.dateBadge, job.isOverdue && { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.dateText, job.isOverdue && { color: '#ef4444' }]}>{job.nextActionDate}</Text>
            </View>
            </View>
        </View>
    )
}

const getActionIcon = (action: string) => {
    if (action.includes('Email')) return 'mail'
    if (action.includes('Interview') || action.includes('Screen')) return 'video'
    if (action.includes('Apply') || action.includes('Application')) return 'file-text'
    if (action.includes('Offer')) return 'check-circle'
    return 'clock'
}

const getStatusColor = (status: JobEntry['status']) => {
    switch (status) {
      case 'Interview': 
      case 'Interviewing': return CLTheme.accent
      case 'Target': return '#f97316' // Orange/Saved
      case 'Applied': return '#6366f1' // Indigo
      case 'Offer Received': return '#10b981' // Green
      case 'Offer Signed': return '#059669' // Darker Green
      case 'Rejected': return '#ef4444' // Red
      case 'Not Interested': return '#64748b' // Slate/Gray
      default: return CLTheme.text.muted
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  headerContainer: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  pageTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: CLTheme.text.primary,
      letterSpacing: -0.5,
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
  },
  activeCountLabel: {
      fontSize: 12,
      color: CLTheme.text.muted,
  },
  avatar: {
      width: 36, 
      height: 36, 
      borderRadius: 18, 
      backgroundColor: '#cbd5e1', 
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: CLTheme.border
  },
  avatarImg: {
      width: '100%',
      height: '100%'
  },
  content: {
      flex: 1,
  },
  // Stats
  statsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
      marginBottom: 24,
  },
  statCard: {
      flex: 1,
      backgroundColor: CLTheme.card,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: CLTheme.text.muted,
      marginBottom: 4,
  },
  statCount: {
      fontSize: 20,
      fontWeight: '700',
  },
  
  // Controls
  controlsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: CLTheme.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 48,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  searchInput: {
      flex: 1,
      color: CLTheme.text.primary,
      fontSize: 14,
  },
  filterScroll: {
      gap: 8,
  },
  filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: CLTheme.card,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  activeFilterChip: {
      backgroundColor: CLTheme.accent,
      borderColor: CLTheme.accent,
  },
  filterText: {
      fontSize: 12,
      fontWeight: '600',
      color: CLTheme.text.secondary,
  },
  activeFilterText: {
      color: '#fff',
  },
  customPrepSection: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
      padding: 14,
      gap: 12,
  },
  customPrepStartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: CLTheme.border,
      borderRadius: 12,
      backgroundColor: 'rgba(13, 108, 242, 0.08)',
      paddingHorizontal: 12,
      paddingVertical: 12,
  },
  customPrepStartLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
  },
  customPrepStartIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(13, 108, 242, 0.12)',
  },
  customPrepStartTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  customPrepStartSubtitle: {
      fontSize: 12,
      color: CLTheme.text.secondary,
      marginTop: 2,
  },
  customPrepEmptyText: {
      fontSize: 13,
      color: CLTheme.text.secondary,
      lineHeight: 19,
      paddingHorizontal: 2,
  },
  customPrepList: {
      gap: 10,
  },
  customPrepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: CLTheme.background,
      borderWidth: 1,
      borderColor: CLTheme.border,
      borderRadius: 12,
      padding: 10,
  },
  customPrepItemRole: {
      fontSize: 13,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  customPrepItemMeta: {
      fontSize: 11,
      color: CLTheme.text.muted,
      marginTop: 2,
  },

  // Sections
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: CLTheme.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  seeAllText: {
      fontSize: 13,
      color: CLTheme.accent,
      fontWeight: '600',
  },
  countBadge: {
      fontSize: 14,
      color: CLTheme.text.muted,
      fontWeight: '600',
  },

  // Rec Slider
  recScroll: {
      paddingLeft: 20,
      marginBottom: 12,
  },
  recCard: {
      width: width * 0.5,
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      padding: 16,
      marginRight: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  recHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  logoBoxSmall: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
  },
  logoTextSmall: {
      fontSize: 14,
      fontWeight: '700',
      color: '#64748b',
  },
  recBadge: {
      backgroundColor: 'rgba(13, 108, 242, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
  },
  recMatch: {
      fontSize: 10,
      fontWeight: '700',
      color: CLTheme.accent,
  },
  recRole: {
      fontSize: 14,
      fontWeight: '700',
      color: CLTheme.text.primary,
      marginBottom: 2,
  },
  recCompany: {
      fontSize: 12,
      color: CLTheme.text.muted,
  },

  // Active List
  list: {
      paddingHorizontal: 20,
      gap: 12,
  },
  card: {
      backgroundColor: CLTheme.card,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
      overflow: 'hidden', // for the left strip
  },
  offerCard: {
      borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  logoBox: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)'
  },
  logoImage: {
      width: '100%',
      height: '100%',
  },
  logoText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#64748b',
  },
  roleText: {
      fontSize: 15,
      fontWeight: '700',
      color: CLTheme.text.primary,
      marginBottom: 2,
  },
  companyText: {
      fontSize: 13,
      color: CLTheme.text.muted,
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
  },
  statusBadgeOffer: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
  },
  statusText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
  },
  actionFooter: {
      marginTop: 16,
      paddingTop: 12,
      paddingLeft: 12, // Align with content since we have left strip
      borderTopWidth: 1,
      borderTopColor: CLTheme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  nextActionBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  actionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: CLTheme.text.secondary,
  },
  dateBadge: {
      backgroundColor: CLTheme.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  dateText: {
      fontSize: 11,
      fontWeight: '600',
      color: CLTheme.text.muted,
  },
  emptyState: {
      padding: 40,
      alignItems: 'center',
  },
  emptyText: {
      color: CLTheme.text.muted,
      fontSize: 14,
  },
  fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: CLTheme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: CLTheme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  addJobModalBody: {
      padding: 20,
      gap: 14,
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
  // Modal Styles
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: CLTheme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '85%',
      width: '100%',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: CLTheme.border,
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: CLTheme.text.primary,
  },
  closeBtn: {
      padding: 4,
  },
  logoBoxLarge: {
      width: 80,
      height: 80,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
  },
  logoTextLarge: {
      fontSize: 32,
      fontWeight: 'bold',
      color: CLTheme.text.muted,
  },
  detailRole: {
      fontSize: 22,
      fontWeight: 'bold',
      color: CLTheme.text.primary,
      textAlign: 'center',
      marginBottom: 4,
  },
  detailCompany: {
      fontSize: 16,
      color: CLTheme.text.muted,
      textAlign: 'center',
  },
  detailSection: {
      marginTop: 24,
      backgroundColor: CLTheme.background,
      padding: 16,
      borderRadius: 12,
  },
  detailLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: CLTheme.text.muted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
  },
  actionText: {
      fontSize: 16,
      fontWeight: '500',
      color: CLTheme.text.primary,
  },
  actionDate: {
      fontSize: 14,
      color: '#ef4444',
      fontWeight: '500',
      marginLeft: 32,
  },
  noteText: {
      color: CLTheme.text.secondary,
      fontSize: 14,
      lineHeight: 20,
  },
  notesInput: {
      marginTop: 8,
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      padding: 12,
      color: CLTheme.text.primary,
      fontSize: 14,
      lineHeight: 20,
      minHeight: 80,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: CLTheme.border
  },
  primaryBtn: {
      marginTop: 32,
      backgroundColor: CLTheme.accent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 40,
  },
  primaryBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  applyContainer: {
      paddingTop: 10,
  },
  applyHeader: {
      fontSize: 17,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  applyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
  },
  applyTabBar: {
      flexDirection: 'row',
      backgroundColor: '#18212f',
      borderRadius: 10,
      marginBottom: 16,
      padding: 3,
  },
  applyTab: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center' as const,
      borderRadius: 8,
  },
  applyTabActive: {
      backgroundColor: '#0d6cf2',
  },
  applyTabText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#64748b',
  },
  applyTabTextActive: {
      color: '#ffffff',
      fontWeight: '700' as const,
  },
  applySubheader: {
      fontSize: 13,
      color: CLTheme.text.muted,
      marginBottom: 16,
      lineHeight: 18,
  },
  advJobCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  advLogoBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
  },
  advLogoImage: {
      width: 36,
      height: 36,
      borderRadius: 6,
  },
  advLogoFallback: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: '#fff',
  },
  advJobTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: CLTheme.text.primary,
  },
  advCompanyLoc: {
      fontSize: 12,
      color: CLTheme.text.muted,
      marginTop: 2,
  },
  advSectionTitle: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: CLTheme.text.muted,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
  },
  advAnswerCard: {
      backgroundColor: CLTheme.background,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
      gap: 6,
  },
  advQuestionText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: CLTheme.text.secondary,
  },
  advAnswerText: {
      fontSize: 13,
      color: CLTheme.text.muted,
      lineHeight: 18,
  },
  selectorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  selectorTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: CLTheme.text.primary,
  },
  selectorSub: {
      fontSize: 12,
      color: CLTheme.text.muted,
  },
  iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: CLTheme.accent,
      alignItems: 'center',
      justifyContent: 'center',
  },
  holdBtnContainer: {
      height: 56,
      backgroundColor: '#334155',
      borderRadius: 28,
      overflow: 'hidden',
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
  },
  holdFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: '#10b981', // Success green or accent
  },
  holdContent: {
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 2, // Above text? No, this is tricky. 
      // Actually we want the "Hold to Apply" text to be visible, then covered or changed?
      // Let's just have the text overlay.
      opacity: 0,
  },
  holdText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },
  statusOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
  },
  statusOptionActive: {
      backgroundColor: CLTheme.card,
      borderColor: CLTheme.accent,
  },
  statusOptionText: {
      fontSize: 16,
      fontWeight: '500',
      color: CLTheme.text.secondary,
  },
  statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
  },
  reasonInput: {
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      padding: 16,
      color: CLTheme.text.primary,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
  },
  updateNoteInput: {
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
      padding: 12,
      color: CLTheme.text.primary,
      fontSize: 14,
      lineHeight: 20,
      minHeight: 88,
      textAlignVertical: 'top',
  },
  dropdownContainer: {
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
      overflow: 'hidden',
      marginTop: 8,
  },
  // --- Credit Styles ---
  creditCostRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: CLTheme.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  creditBalanceSmall: {
      fontSize: 12,
      color: CLTheme.text.secondary,
      fontWeight: '500',
  },
  creditEstimate: {
      fontSize: 12,
      color: CLTheme.text.muted,
      fontWeight: '500',
  },
  creditWarning: {
      fontSize: 12,
      color: '#ef4444',
      textAlign: 'center',
      marginTop: 10,
  },
  outreachOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.55)',
  },
  outreachBackdrop: {
      ...StyleSheet.absoluteFillObject,
  },
  outreachSheet: {
      backgroundColor: CLTheme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: CLTheme.border,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
      gap: 14,
  },
  outreachHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: CLTheme.border,
      alignSelf: 'center',
      marginBottom: 2,
  },
  outreachHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
  },
  outreachTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  outreachSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: CLTheme.accent,
      fontWeight: '600',
  },
  outreachMeta: {
      marginTop: 2,
      fontSize: 11,
      color: CLTheme.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
  },
  outreachEditorCard: {
      backgroundColor: CLTheme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
  },
  outreachEditorLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: CLTheme.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
  },
  outreachTextarea: {
      color: CLTheme.text.primary,
      minHeight: 140,
      fontSize: 14,
      lineHeight: 21,
  },
  outreachActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  outreachGenerateBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: CLTheme.accent,
      borderRadius: 12,
      paddingVertical: 13,
  },
  outreachGenerateBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
  },
  outreachCopyBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(13, 108, 242, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(13, 108, 242, 0.35)',
      borderRadius: 12,
      paddingVertical: 13,
  },
  outreachCopyBtnText: {
      color: CLTheme.accent,
      fontSize: 14,
      fontWeight: '700',
  },
  outreachMarkSentBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
  },
  applyNowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: CLTheme.accent,
      borderRadius: 14,
      paddingVertical: 16,
  },
  applyNowBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },
  advCTABtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#10b981',
      borderRadius: 12,
      paddingVertical: 14,
  },
  aiGenBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(13, 108, 242, 0.10)',
      borderWidth: 1,
      borderColor: 'rgba(13, 108, 242, 0.3)',
      borderRadius: 10,
      paddingVertical: 10,
  },
  aiGenBtnText: {
      color: '#0d6cf2',
      fontSize: 12,
      fontWeight: '600',
  },
  aiGenBtnSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(13, 108, 242, 0.10)',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
  },
})
