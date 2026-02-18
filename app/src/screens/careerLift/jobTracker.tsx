import React, { useState } from 'react'
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

const { width, height } = Dimensions.get('window')

const RESUMES = [
  { id: 'r1', title: 'Product Design V4', subtitle: 'Last edited 2d ago', content: 'EXPERIENCE\n\nSenior Product Designer | Tech Co.\n- Led design system overhaul\n- Increased conversion by 15%' },
  { id: 'r2', title: 'UX Engineer Specialist', subtitle: 'Last edited 5d ago', content: 'EXPERIENCE\n\nUX Engineer | Startup Inc.\n- Built accessible component library\n- Prototyped complex interactions with React Native' },
]

const COVER_LETTERS = [
  { id: 'c1', title: 'AI Generated Tailored', subtitle: 'Relevance: High • 300 words', content: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in this role. My background in...' },
  { id: 'c2', title: 'Standard Cover Letter', subtitle: 'General Purpose', content: 'To whom it may concern,\n\nPlease accept this letter and the enclosed resume as an expression of my interest...' },
]

export function JobTrackerScreen() {
  const navigation = useNavigation<any>()
  const { thisWeek, nextUp, recommendedJobs, filters, activeFilter, setFilter, updateJobStatus, updateJobNotes } = useJobTrackerStore()
  const { avatarUrl, customInterviewPreps = [] } = useUserProfileStore()
  const { roleTrack, targetRole, locationPreference } = useCareerSetupStore()
  const { balance: creditBalance, canAfford: canAffordCredit } = useCreditsStore()
  const applyCost = CREDIT_COSTS.aiApplicationSubmit
  const canAffordApply = canAffordCredit('aiApplicationSubmit')
  const creditColor = creditBalance > 30 ? '#10b981' : creditBalance > 10 ? '#f59e0b' : '#ef4444'

  // Dynamic Filters based on user profile
  const userFilters = ['All Roles', roleTrack, targetRole || 'Senior Engineer', locationPreference].filter(Boolean) as string[]
  // Ensure "All Roles" is always first and unique
  const displayFilters = Array.from(new Set(['All Roles', ...userFilters]))

  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState<'All' | 'Applied' | 'Interview' | 'Interviewing' | 'Offer' | 'Target' | 'Not Interested'>('All')
  
  // Job Detail Modal State
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<JobEntry['status']>('Applied')
  const [disqualifyReason, setDisqualifyReason] = useState('')
  const [notes, setNotes] = useState('')
  
  // Application Prep State
  const [selectedResume, setSelectedResume] = useState(RESUMES[0])
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(COVER_LETTERS[0])
  const [activeDropdown, setActiveDropdown] = useState<'resume' | 'coverLetter' | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{title: string, content: string} | null>(null)

  const fillAnim = React.useRef(new Animated.Value(0)).current

  // Restore modal when returning from other screens if job was selected
  useFocusEffect(
      useCallback(() => {
          if (selectedJob && !modalVisible) {
              setModalVisible(true)
          }
      }, [selectedJob, modalVisible])
  )
  const openJobDetails = (job: JobEntry) => {
      setSelectedJob(job)
      setModalVisible(true)
      setIsApplying(false)
      setIsUpdatingStatus(false)
      setNewStatus(job.status)
      setDisqualifyReason('')
      setNotes(job.notes || '')
      setActiveDropdown(null)
      // Reset selections to defaults or last used? Defaults for now.
      setSelectedResume(RESUMES[0])
      setSelectedCoverLetter(COVER_LETTERS[0])
      fillAnim.setValue(0)
  }

  const closeJobDetails = () => {
      setModalVisible(false)
      setSelectedJob(null)
      setIsApplying(false)
      setIsUpdatingStatus(false)
      setActiveDropdown(null)
      setPreviewDoc(null)
      fillAnim.setValue(0)
  }

  const handleUpdateStatus = () => {
      if (selectedJob) {
          updateJobStatus(selectedJob.id, newStatus)
          closeJobDetails()
      }
  }

  const handleHoldStart = () => {
      Animated.timing(fillAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false
      }).start(({ finished }) => {
          if (finished) {
              Alert.alert("Application Submitted", "Good luck! The AI has processed your application.")
              closeJobDetails()
              // TODO: Update job status in store to 'Applied'
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

  const fillWidth = fillAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
  })

  // Combine all active jobs
  const allActiveJobs = [...thisWeek, ...nextUp]

  // Filter Logic
  const getFilteredJobs = (jobs: JobEntry[]) => {
      return jobs.filter(job => {
        // 1. Search
        const matchesSearch = 
           job.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
           job.company.toLowerCase().includes(searchQuery.toLowerCase())
        
        // 2. Status Filter
        const matchesStatus = activeStatus === 'All' ? true : 
                              activeStatus === 'Offer' ? job.status.includes('Offer') : 
                              activeStatus === 'Interview' ? (job.status === 'Interview' || job.status === 'Interviewing') :
                              job.status === activeStatus

        // 3. Role/Tag Filter (Chips)
        let matchesRole = true
        if (activeFilter !== 'All Roles') {
            matchesRole = job.role.includes(activeFilter) || (job.tags?.includes(activeFilter) ?? false)
            // Fuzzy match for tracks
            if (activeFilter === 'Product Design') matchesRole = matchesRole || job.role.includes('Designer')
            if (activeFilter === 'Engineering') matchesRole = matchesRole || job.role.includes('Engineer') || job.role.includes('Developer')
        }

        return matchesSearch && matchesStatus && matchesRole
      })
  }

  const displayedJobs = getFilteredJobs(allActiveJobs)
  const isFiltering = activeStatus !== 'All' || searchQuery.length > 0 || activeFilter !== 'All Roles'

  // Counts
  const appliedCount = allActiveJobs.filter(j => j.status === 'Applied').length
  const interviewCount = allActiveJobs.filter(j => j.status === 'Interview' || j.status === 'Interviewing').length
  const offerCount = allActiveJobs.filter(j => j.status.includes('Offer')).length
  const savedCount = allActiveJobs.filter(j => j.status === 'Target').length

  const handleStatusPress = (status: 'All' | 'Applied' | 'Interview' | 'Interviewing' | 'Offer' | 'Target' | 'Not Interested') => {
      if (activeStatus === status && status !== 'All') {
          setActiveStatus('All')
      } else {
          setActiveStatus(status)
      }
  }

  const handleStartCustomInterviewPrep = () => {
    navigation.navigate('SettingsProfile', { openCustomPrepAt: Date.now() })
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
                          <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
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
                  <TouchableOpacity key={job.id} style={styles.recCard} activeOpacity={0.8} onPress={() => openJobDetails(job)}>
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
                        <TouchableOpacity key={job.id} activeOpacity={0.9} onPress={() => openJobDetails(job)}>
                            {renderJobCard(job)}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Next Up</Text>
                </View>
                <View style={styles.list}>
                    {nextUp.map(job => (
                        <TouchableOpacity key={job.id} activeOpacity={0.9} onPress={() => openJobDetails(job)}>
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
                       <TouchableOpacity key={job.id} activeOpacity={0.9} onPress={() => openJobDetails(job)}>
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
      <TouchableOpacity style={styles.fab}>
          <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
      
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

                                  <TouchableOpacity 
                                      style={[styles.primaryBtn, {marginBottom: 16}]} 
                                      onPress={handleUpdateStatus}
                                  >
                                      <Text style={styles.primaryBtnText}>Save Update</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity style={{alignItems: 'center'}} onPress={() => setIsUpdatingStatus(false)}>
                                      <Text style={{color: CLTheme.text.muted}}>Cancel</Text>
                                  </TouchableOpacity>
                              </View>
                          ) : (
                              <View style={styles.applyContainer}>
                                  <Text style={styles.applyHeader}>Prepare Application</Text>
                                  
                                  {renderDocumentSelector('resume', selectedResume, RESUMES, setSelectedResume)}
                                  {renderDocumentSelector('coverLetter', selectedCoverLetter, COVER_LETTERS, setSelectedCoverLetter)}

                                  <View style={{marginTop: 40}}>
                                      <View style={styles.creditCostRow}>
                                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                              <Feather name="zap" size={14} color={creditColor} />
                                              <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
                                          </View>
                                          <Text style={styles.creditEstimate}>Est. cost: ~{applyCost} credits</Text>
                                      </View>
                                      <Text style={[styles.detailLabel, {textAlign: 'center', marginBottom: 16}]}>Hold to Apply with AI</Text>
                                      <Pressable
                                          onPressIn={canAffordApply ? handleHoldStart : undefined}
                                          onPressOut={handleHoldEnd}
                                          style={[styles.holdBtnContainer, !canAffordApply && {opacity: 0.4}]}
                                      >
                                          <Animated.View style={[styles.holdFill, { width: fillWidth }]} />
                                          <View style={styles.holdContent}>
                                              <Feather name="send" size={20} color="#fff" style={{marginRight: 8}} />
                                              <Text style={styles.holdText}>Applying...</Text>
                                          </View>
                                          <View style={{position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                               <Text style={[styles.holdText, {opacity: 1}]}>Hold to Apply</Text>
                                          </View>
                                      </Pressable>
                                      {!canAffordApply && (
                                          <Text style={styles.creditWarning}>Not enough credits</Text>
                                      )}
                                  </View>

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
      fontSize: 20,
      fontWeight: '700',
      color: CLTheme.text.primary,
      marginBottom: 20,
      textAlign: 'center',
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
})
