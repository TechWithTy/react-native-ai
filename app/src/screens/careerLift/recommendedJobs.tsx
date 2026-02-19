import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import {
  useJobTrackerStore,
  JobEntry,
  RecommendedScreenFilter,
  RecommendedSortOption,
  RecommendedSalaryRange,
  RecommendedExperienceLevel,
} from '../../store/jobTrackerStore'
import { CLTheme } from './theme'
import { useNavigation } from '@react-navigation/native'
import { NotificationsPanel } from './components/notificationsPanel'
import { LocationAutocomplete } from './components/locationAutocomplete'
import { useUserProfileStore } from '../../store/userProfileStore'
import { useNotificationsPanelState } from './components/useNotificationsPanelState'

const { height } = Dimensions.get('window')
const screenFilters: RecommendedScreenFilter[] = ['All Matches', 'Remote', 'Full-time', 'Product Design']
const sortOptions = [
  { value: 'matchDesc', label: 'Match: High to Low' },
  { value: 'matchAsc', label: 'Match: Low to High' },
  { value: 'roleAZ', label: 'Role: A to Z' },
  { value: 'companyAZ', label: 'Company: A to Z' },
] as const
const salaryRangeOptions: RecommendedSalaryRange[] = ['Any', '<$80k', '$100k+', '$150k+', '$180k+']
const experienceLevelOptions: RecommendedExperienceLevel[] = ['Any', 'Entry', 'Mid', 'Senior', 'Lead+']
const salaryThresholdByRange: Record<Exclude<RecommendedSalaryRange, 'Any'>, number> = {
  '<$80k': 80,
  '$100k+': 100,
  '$150k+': 150,
  '$180k+': 180,
}
const matchesSalaryRangeOption = (salaryInK: number, range: RecommendedSalaryRange) => {
  if (range === 'Any') return true
  if (range === '<$80k') return salaryInK > 0 && salaryInK < salaryThresholdByRange['<$80k']
  return salaryInK >= salaryThresholdByRange[range]
}

export function RecommendedJobsScreen() {
  const navigation = useNavigation<any>()
  const { currentLocation } = useUserProfileStore()
  const {
    recommendedActiveFilter,
    setRecommendedActiveFilter,
    recommendedScanPreset,
    saveRecommendedScanPreset,
    clearRecommendedScanPreset,
    recommendedJobs,
    savedJobIds,
    toggleSaveJob,
  } = useJobTrackerStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [filtersModalVisible, setFiltersModalVisible] = useState(false)
  const {
    showNotifications,
    notifications,
    openNotifications,
    closeNotifications,
    handleNotificationPress,
    handleClearNotification,
    handleClearAllNotifications,
  } = useNotificationsPanelState({
    onNavigate: (screen, params) => navigation.navigate(screen, params),
  })
  const [sortBy, setSortBy] = useState<RecommendedSortOption>('matchDesc')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [fullTimeOnly, setFullTimeOnly] = useState(false)
  const [hybridOnly, setHybridOnly] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [salaryRange, setSalaryRange] = useState<RecommendedSalaryRange>('Any')
  const [experienceLevel, setExperienceLevel] = useState<RecommendedExperienceLevel>('Any')
  const [presetName, setPresetName] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null)

  const normalizedFilter = screenFilters.includes(recommendedActiveFilter) ? recommendedActiveFilter : 'All Matches'

  useEffect(() => {
    if (!recommendedScanPreset) return

    setSortBy(recommendedScanPreset.sortBy)
    setRemoteOnly(recommendedScanPreset.remoteOnly)
    setFullTimeOnly(recommendedScanPreset.fullTimeOnly)
    setHybridOnly(recommendedScanPreset.hybridOnly)
    setLocationQuery(recommendedScanPreset.locationQuery)
    setSalaryRange(recommendedScanPreset.salaryRange || 'Any')
    setExperienceLevel(recommendedScanPreset.experienceLevel || 'Any')
    setPresetName(recommendedScanPreset.name)
    setRecommendedActiveFilter(recommendedScanPreset.screenFilter)
  }, [recommendedScanPreset, setRecommendedActiveFilter])

  const hasTag = (job: JobEntry, expectedTag: string) =>
    job.tags?.some(tag => tag.toLowerCase() === expectedTag.toLowerCase()) ?? false

  const parseMatchScore = (job: JobEntry) => {
    if (!job.match) {
      return 0
    }
    const numeric = Number.parseInt(job.match.replace(/[^\d]/g, ''), 10)
    return Number.isNaN(numeric) ? 0 : numeric
  }

  const parseSalaryInK = (job: JobEntry) => {
    const source = [job.salary || '', ...(job.tags || [])].join(' ')
    const annualMatches = Array.from(source.matchAll(/(\d{2,3})\s*k/gi)).map(match => Number.parseInt(match[1], 10))
    if (annualMatches.length > 0) {
      return Math.max(...annualMatches)
    }

    const hourlyMatch = source.match(/\$?\s*(\d{2,3})(?:\s*-\s*\$?\s*(\d{2,3}))?\s*\/\s*hr/i)
    if (hourlyMatch) {
      const low = Number.parseInt(hourlyMatch[1], 10)
      const high = hourlyMatch[2] ? Number.parseInt(hourlyMatch[2], 10) : low
      return Math.round(Math.max(low, high) * 2.08)
    }

    const annualDollarMatches = Array.from(source.matchAll(/\$?\s*(\d{5,6})(?!\s*\/\s*hr)/g)).map(match =>
      Number.parseInt(match[1], 10)
    )
    if (annualDollarMatches.length > 0) {
      return Math.round(Math.max(...annualDollarMatches) / 1000)
    }

    return 0
  }

  const inferExperienceLevel = (role: string): Exclude<RecommendedExperienceLevel, 'Any'> => {
    const normalized = role.toLowerCase()
    if (/\b(intern|entry|junior|jr|associate)\b/.test(normalized)) return 'Entry'
    if (/\b(principal|staff|lead|director|head|vp|chief|manager)\b/.test(normalized)) return 'Lead+'
    if (/\b(senior|sr)\b/.test(normalized)) return 'Senior'
    return 'Mid'
  }

  const matchesScreenFilter = (job: JobEntry, filter: string) => {
    if (filter === 'Remote') {
      return (
        job.location.toLowerCase().includes('remote') ||
        (job.tags?.some(tag => tag.toLowerCase() === 'remote') ?? false)
      )
    }

    if (filter === 'Full-time') {
      return job.tags?.some(tag => tag.toLowerCase() === 'full-time') ?? false
    }

    if (filter === 'Product Design') {
      const role = job.role.toLowerCase()
      return role.includes('product') || role.includes('design')
    }

    return true
  }

  const matchesSearchAndAdvancedFilters = (job: JobEntry) => {
    const query = searchQuery.trim().toLowerCase()
    const normalizedLocationQuery = locationQuery.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      job.role.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    const matchesRemoteOnly = !remoteOnly || job.location.toLowerCase().includes('remote') || hasTag(job, 'Remote')
    const matchesFullTimeOnly = !fullTimeOnly || hasTag(job, 'Full-time')
    const matchesHybridOnly = !hybridOnly || hasTag(job, 'Hybrid')
    const matchesSalaryRange = matchesSalaryRangeOption(parseSalaryInK(job), salaryRange)
    const matchesExperienceLevel = experienceLevel === 'Any' || inferExperienceLevel(job.role) === experienceLevel
    const matchesLocation =
      normalizedLocationQuery.length === 0 ||
      job.location.toLowerCase().includes(normalizedLocationQuery) ||
      (normalizedLocationQuery.includes('remote') && hasTag(job, 'Remote'))

    return (
      matchesSearch &&
      matchesRemoteOnly &&
      matchesFullTimeOnly &&
      matchesHybridOnly &&
      matchesSalaryRange &&
      matchesExperienceLevel &&
      matchesLocation
    )
  }

  const filterCounts = Object.fromEntries(
    screenFilters.map(filter => [
      filter,
      recommendedJobs.filter(job => matchesSearchAndAdvancedFilters(job) && matchesScreenFilter(job, filter)).length,
    ])
  ) as Record<string, number>

  const filteredJobs = recommendedJobs.filter(
    job => matchesSearchAndAdvancedFilters(job) && matchesScreenFilter(job, normalizedFilter)
  )
  const savedPresetDescriptor = recommendedScanPreset
    ? recommendedScanPreset.name === recommendedScanPreset.label
      ? recommendedScanPreset.name
      : `${recommendedScanPreset.name} • ${recommendedScanPreset.label}`
    : ''

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'matchAsc') {
      return parseMatchScore(a) - parseMatchScore(b)
    }
    if (sortBy === 'roleAZ') {
      return a.role.localeCompare(b.role)
    }
    if (sortBy === 'companyAZ') {
      return a.company.localeCompare(b.company)
    }
    return parseMatchScore(b) - parseMatchScore(a)
  })

  const handleCardPress = (job: JobEntry) => {
    navigation.navigate('JobDetails', { job })
  }

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
      return
    }
    navigation.navigate('Dashboard')
  }

  const resetFiltersAndSort = () => {
    setSortBy('matchDesc')
    setRemoteOnly(false)
    setFullTimeOnly(false)
    setHybridOnly(false)
    setLocationQuery('')
    setSalaryRange('Any')
    setExperienceLevel('Any')
    setPresetName('')
    setRecommendedActiveFilter('All Matches')
    clearRecommendedScanPreset()
  }

  const saveCurrentFilters = () => {
    saveRecommendedScanPreset({
      screenFilter: normalizedFilter,
      sortBy,
      remoteOnly,
      fullTimeOnly,
      hybridOnly,
      locationQuery,
      salaryRange,
      experienceLevel,
      name: presetName,
    })
  }

  const handleUseFiltersInScan = () => {
    saveCurrentFilters()
    setFiltersModalVisible(false)
    navigation.navigate('Dashboard', { startScanFromSavedFilters: true })
  }

  const renderJobCard = ({ item }: { item: JobEntry }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.logoBox}>
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.logoImage} resizeMode='cover' />
            ) : (
              <Text style={styles.logoText}>{item.company.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.roleText}>{item.role}</Text>
            <Text style={styles.companyText}>
              {item.company}  {item.location}
            </Text>
          </View>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchPercentage}>{item.match ?? '--'}</Text>
          <Text style={styles.matchLabel}>Match</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {item.tags?.map((tag, index) => {
          const isPrimaryTag = index === 0 && (tag === 'Remote' || tag === 'Hybrid')
          return (
            <View key={`${item.id}-${tag}-${index}`} style={[styles.tagChip, isPrimaryTag && styles.primaryTagChip]}>
              <Text style={[styles.tagText, isPrimaryTag && styles.primaryTagText]}>{tag}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => handleCardPress(item)} activeOpacity={0.86}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookmarkBtn} activeOpacity={0.8} onPress={() => toggleSaveJob(item)}>
          <MaterialIcons
            name={savedJobIds.includes(item.id) ? 'bookmark' : 'bookmark-border'}
            size={22}
            color={savedJobIds.includes(item.id) ? CLTheme.accent : CLTheme.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={handleBackPress} hitSlop={8}>
              <MaterialIcons name='arrow-back' size={24} color={CLTheme.accent} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Recommended for You</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.85}
            onPress={openNotifications}
            accessibilityLabel='Open notifications'
          >
            <MaterialIcons name='notifications-none' size={22} color={CLTheme.text.primary} />
            {notifications.length > 0 ? <View style={styles.notificationDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name='search' size={17} color={CLTheme.text.muted} style={styles.searchIcon} />
            <TextInput
              placeholder='Search job titles, companies...'
              placeholderTextColor={CLTheme.text.muted}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.85}
            onPress={() => setFiltersModalVisible(true)}
            accessibilityLabel='Open job filters'
          >
            <MaterialIcons name='tune' size={20} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {screenFilters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, normalizedFilter === filter && styles.activeFilterChip]}
              onPress={() => setRecommendedActiveFilter(filter)}
            >
              <Text style={[styles.filterText, normalizedFilter === filter && styles.activeFilterText]}>
                {filter} ({filterCounts[filter]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={sortedJobs}
        keyExtractor={item => item.id}
        renderItem={renderJobCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No jobs found</Text>
            <Text style={styles.emptyStateText}>Try a different search or filter.</Text>
          </View>
        }
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />

      <Modal animationType='slide' transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={event => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            {selectedJob ? (
              <View style={styles.modalBody}>
                <View style={styles.modalTop}>
                  <View style={styles.logoBoxLarge}>
                    {selectedJob.logo ? (
                      <Image source={{ uri: selectedJob.logo }} style={styles.logoImageLarge} resizeMode='cover' />
                    ) : (
                      <Text style={styles.logoTextLarge}>{selectedJob.company.charAt(0)}</Text>
                    )}
                  </View>
                  <Text style={styles.modalRole}>{selectedJob.role}</Text>
                  <Text style={styles.modalCompany}>
                    {selectedJob.company} • {selectedJob.location}
                  </Text>
                  <Text style={styles.modalMatch}>{selectedJob.match ?? '--'} Match</Text>
                </View>

                <View style={styles.modalNotesCard}>
                  <Text style={styles.modalNotesTitle}>Notes</Text>
                  <Text style={styles.modalNotesText}>
                    {selectedJob.notes || 'Strong role fit based on your current profile and preferences.'}
                  </Text>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.primaryButtonText}>Apply Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType='slide'
        transparent
        visible={filtersModalVisible}
        onRequestClose={() => setFiltersModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFiltersModalVisible(false)}>
          <Pressable style={styles.filtersModalContent} onPress={event => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <ScrollView
              style={styles.filtersModalScroll}
              contentContainerStyle={styles.filtersModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              <Text style={styles.filtersTitle}>Filter & Sort Jobs</Text>
              <Text style={styles.filtersSubtitle}>Showing {sortedJobs.length} jobs</Text>

              <View style={styles.filtersSection}>
                <Text style={styles.filtersSectionTitle}>Sort</Text>
                {sortOptions.map(option => {
                  const selected = sortBy === option.value
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.optionRow}
                      onPress={() => setSortBy(option.value)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                      <MaterialIcons
                        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={selected ? CLTheme.accent : '#64748b'}
                      />
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={styles.filtersSection}>
                <Text style={styles.filtersSectionTitle}>Filters</Text>
                <View style={styles.quickFiltersRow}>
                  <TouchableOpacity
                    style={[styles.quickFilterChip, remoteOnly && styles.quickFilterChipActive]}
                    onPress={() => setRemoteOnly(value => !value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.quickFilterText, remoteOnly && styles.quickFilterTextActive]}>Remote only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickFilterChip, fullTimeOnly && styles.quickFilterChipActive]}
                    onPress={() => setFullTimeOnly(value => !value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.quickFilterText, fullTimeOnly && styles.quickFilterTextActive]}>
                      Full-time only
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickFilterChip, hybridOnly && styles.quickFilterChipActive]}
                    onPress={() => setHybridOnly(value => !value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.quickFilterText, hybridOnly && styles.quickFilterTextActive]}>Hybrid only</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.filterSubsectionTitle}>Salary Range</Text>
                <View style={styles.filterOptionsRow}>
                  {salaryRangeOptions.map(option => {
                    const selected = salaryRange === option
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.filterOptionChip, selected && styles.filterOptionChipActive]}
                        onPress={() => setSalaryRange(option)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>{option}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <Text style={styles.filterSubsectionTitle}>Experience Level</Text>
                <View style={styles.filterOptionsRow}>
                  {experienceLevelOptions.map(option => {
                    const selected = experienceLevel === option
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.filterOptionChip, selected && styles.filterOptionChipActive]}
                        onPress={() => setExperienceLevel(option)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.filtersSection}>
                <Text style={styles.filtersSectionTitle}>Location</Text>
                <LocationAutocomplete
                  value={locationQuery}
                  onChangeText={setLocationQuery}
                  onSelect={setLocationQuery}
                  currentLocation={currentLocation}
                  placeholder='City, State or Remote'
                  showSearchIcon
                  inputContainerStyle={styles.locationFilterInputContainer}
                  suggestionsContainerStyle={styles.locationFilterSuggestions}
                  suggestionRowStyle={styles.locationFilterSuggestionRow}
                  suggestionTextStyle={styles.locationFilterSuggestionText}
                />
              </View>

              <View style={styles.filtersSection}>
                <Text style={styles.filtersSectionTitle}>Preset Name</Text>
                <TextInput
                  value={presetName}
                  onChangeText={setPresetName}
                  style={styles.presetNameInput}
                  placeholder='e.g. Remote PM Roles'
                  placeholderTextColor='#64748b'
                />
              </View>

              <View style={styles.savedPresetCard}>
                <Text style={styles.savedPresetTitle}>Saved Scan Preset</Text>
                <Text style={styles.savedPresetText}>
                  {recommendedScanPreset
                    ? `${savedPresetDescriptor} • ${new Date(recommendedScanPreset.savedAt).toLocaleDateString()}`
                    : 'No saved preset yet. Save your current filters to reuse in scan.'}
                </Text>
              </View>

              <View style={styles.savedPresetActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={saveCurrentFilters}
                  activeOpacity={0.85}
                  accessibilityLabel='Save recommended filters'
                >
                  <Text style={styles.secondaryButtonText}>Save Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleUseFiltersInScan}
                  activeOpacity={0.88}
                  accessibilityLabel='Use filters in scan'
                >
                  <Text style={styles.primaryButtonText}>Use in Scan</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filtersFooter}>
                <TouchableOpacity style={styles.secondaryButton} onPress={resetFiltersAndSort} activeOpacity={0.85}>
                  <Text style={styles.secondaryButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setFiltersModalVisible(false)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <NotificationsPanel
        visible={showNotifications}
        onClose={closeNotifications}
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
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#223249',
    backgroundColor: '#101722',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    flex: 1,
  },
  pageTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: CLTheme.accent,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 14,
  },
  searchContainer: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a222e',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: CLTheme.text.primary,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a222e',
  },
  filterScroll: {
    columnGap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#1a222e',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: CLTheme.accent,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    rowGap: 14,
  },
  card: {
    backgroundColor: '#1a222e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223249',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    columnGap: 12,
    flex: 1,
  },
  cardCopy: {
    flex: 1,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#223249',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    color: '#e2e8f0',
    fontSize: 19,
    fontWeight: '700',
  },
  roleText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  companyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  matchBadge: {
    alignItems: 'flex-end',
  },
  matchPercentage: {
    color: CLTheme.accent,
    fontSize: 20,
    fontWeight: '700',
  },
  matchLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
    marginBottom: 14,
  },
  tagChip: {
    borderRadius: 6,
    backgroundColor: '#223249',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  primaryTagChip: {
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  tagText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  primaryTagText: {
    color: CLTheme.accent,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    borderTopWidth: 1,
    borderTopColor: '#223249',
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  bookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#223249',
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#1a222e',
  },
  emptyStateTitle: {
    color: CLTheme.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    color: CLTheme.text.secondary,
    fontSize: 13,
  },
  bottomSpacer: {
    height: 94,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalContent: {
    height: height * 0.67,
    backgroundColor: '#101722',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: '#223249',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  filtersModalContent: {
    maxHeight: height * 0.86,
    backgroundColor: '#101722',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: '#223249',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  filtersModalScroll: {
    flexGrow: 0,
  },
  filtersModalScrollContent: {
    paddingBottom: 14,
  },
  filtersTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  filtersSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 18,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersSectionTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  optionRow: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#223249',
    paddingHorizontal: 12,
    backgroundColor: '#1a222e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  quickFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  filterSubsectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  filterOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#223249',
    backgroundColor: '#1a222e',
  },
  filterOptionChipActive: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.18)',
  },
  filterOptionText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: CLTheme.accent,
  },
  quickFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#223249',
    backgroundColor: '#1a222e',
  },
  quickFilterChipActive: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.18)',
  },
  quickFilterText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  quickFilterTextActive: {
    color: CLTheme.accent,
  },
  locationFilterInputContainer: {
    backgroundColor: '#1a222e',
    borderColor: '#223249',
  },
  locationFilterSuggestions: {
    borderColor: '#223249',
    backgroundColor: '#1a222e',
    maxHeight: 150,
  },
  locationFilterSuggestionRow: {
    borderBottomColor: '#223249',
  },
  locationFilterSuggestionText: {
    color: '#cbd5e1',
  },
  presetNameInput: {
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 10,
    backgroundColor: '#1a222e',
    color: '#f8fafc',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedPresetCard: {
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 12,
    backgroundColor: '#1a222e',
    padding: 12,
    marginBottom: 10,
  },
  savedPresetTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  savedPresetText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  savedPresetActions: {
    flexDirection: 'row',
    columnGap: 10,
    marginBottom: 8,
  },
  filtersFooter: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 8,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#223249',
    marginBottom: 16,
  },
  modalBody: {
    flex: 1,
  },
  modalTop: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoBoxLarge: {
    width: 66,
    height: 66,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#223249',
  },
  logoImageLarge: {
    width: '100%',
    height: '100%',
  },
  logoTextLarge: {
    color: '#e2e8f0',
    fontSize: 25,
    fontWeight: '700',
  },
  modalRole: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalCompany: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  modalMatch: {
    marginTop: 10,
    color: CLTheme.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  modalNotesCard: {
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#1a222e',
    marginBottom: 'auto',
  },
  modalNotesTitle: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  modalNotesText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#223249',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a222e',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
})
