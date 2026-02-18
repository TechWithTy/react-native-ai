import React, { useMemo, useState } from 'react'
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import * as DocumentPicker from 'expo-document-picker'
import { CLTheme } from './theme'
import {
  CareerDocument,
  CareerDocumentStatus,
  CareerDocumentType,
  useUserProfileStore,
} from '../../store/userProfileStore'
import { useCareerSetupStore } from '../../store/careerSetup'

const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

const STATUS_META: Record<
  CareerDocumentStatus,
  { label: string; textColor: string; backgroundColor: string; borderColor: string }
> = {
  interviewing: {
    label: 'Interviewing',
    textColor: '#c4b5fd',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  applied: {
    label: 'Applied',
    textColor: CLTheme.text.secondary,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
  },
  offer: {
    label: 'Offer',
    textColor: '#86efac',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  rejected: {
    label: 'Rejected',
    textColor: '#fca5a5',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
}

const STATUS_CYCLE_ORDER: CareerDocumentStatus[] = ['applied', 'interviewing', 'offer', 'rejected']

function getRelativeUpdatedLabel(isoTimestamp: string) {
  const timestamp = new Date(isoTimestamp).getTime()
  if (Number.isNaN(timestamp)) return 'Updated recently'
  const deltaMs = Date.now() - timestamp
  const deltaDays = Math.floor(deltaMs / (1000 * 60 * 60 * 24))
  if (deltaDays <= 0) return 'Updated today'
  if (deltaDays === 1) return 'Updated 1d ago'
  if (deltaDays < 7) return `Updated ${deltaDays}d ago`
  if (deltaDays < 30) return `Updated ${Math.floor(deltaDays / 7)}w ago`
  return `Updated ${Math.floor(deltaDays / 30)}mo ago`
}

function resolveDocumentIcon(type: CareerDocumentType) {
  return type === 'resume' ? 'description' : 'article'
}

type DocumentFilterType = 'all' | CareerDocumentType
type SortMode = 'date' | 'conversion'

export function DocumentsInsightsScreen() {
  const navigation = useNavigation<any>()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<DocumentFilterType>('all')
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [showAddModal, setShowAddModal] = useState(false)

  const { roleTrack, targetRole, setCareerSetup } = useCareerSetupStore()
  const {
    careerDocuments,
    currentLocation,
    addCareerDocument,
    updateCareerDocument,
    removeCareerDocument,
  } = useUserProfileStore()

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const docs = careerDocuments.filter(document => {
      if (filterType !== 'all' && document.type !== filterType) return false
      if (!normalizedQuery) return true
      return (
        document.name.toLowerCase().includes(normalizedQuery) ||
        (document.targetLabel || '').toLowerCase().includes(normalizedQuery) ||
        (document.track || '').toLowerCase().includes(normalizedQuery)
      )
    })

    const sorted = [...docs]
    if (sortMode === 'date') {
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } else {
      sorted.sort((a, b) => b.conversionRate - a.conversionRate)
    }
    return sorted
  }, [careerDocuments, filterType, searchQuery, sortMode])

  const applicationsCount = careerDocuments.length
  const interviewCount = careerDocuments.filter(
    document => document.status === 'interviewing' || document.status === 'offer'
  ).length
  const interviewRate = applicationsCount ? Math.round((interviewCount / applicationsCount) * 100) : 0
  const recentUploads = careerDocuments.filter(
    document => Date.now() - new Date(document.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000
  ).length

  const handleUploadDocument = async (type: CareerDocumentType) => {
    setShowAddModal(false)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...ACCEPTED_DOCUMENT_MIME_TYPES],
        multiple: false,
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      const name = asset.name || (type === 'resume' ? 'Uploaded_Resume' : 'Uploaded_CoverLetter')
      const mimeType = asset.mimeType ?? null
      const validExtension = /\.(pdf|doc|docx)$/i.test(name)
      const validMimeType = mimeType ? ACCEPTED_DOCUMENT_MIME_TYPES.includes(mimeType as any) : false

      if (!validExtension && !validMimeType) {
        Alert.alert('Unsupported file', 'Only PDF, DOC, and DOCX files are supported.')
        return
      }

      addCareerDocument({
        name,
        type,
        uri: asset.uri,
        mimeType,
        targetLabel: targetRole ? `${targetRole}${currentLocation ? ` • ${currentLocation}` : ''}` : null,
        track: roleTrack || null,
        status: 'applied',
        conversionRate: type === 'resume' ? 0.12 : 0.05,
      })

      if (type === 'resume') {
        setCareerSetup({ sourceResumeName: name })
      }

      Alert.alert('Document added', `${name} was added to Documents & Insights.`)
    } catch {
      Alert.alert('Upload failed', 'Could not open document picker.')
    }
  }

  const cycleDocumentStatus = (document: CareerDocument) => {
    const currentIndex = STATUS_CYCLE_ORDER.indexOf(document.status)
    const nextStatus = STATUS_CYCLE_ORDER[(currentIndex + 1) % STATUS_CYCLE_ORDER.length]
    const nextConversion =
      nextStatus === 'offer'
        ? 1
        : nextStatus === 'interviewing'
          ? 0.3
          : nextStatus === 'applied'
            ? 0.12
            : 0

    updateCareerDocument(document.id, {
      status: nextStatus,
      conversionRate: nextConversion,
    })
  }

  const handleOpenDocument = async (uri: string) => {
    try {
      const canOpen = await Linking.canOpenURL(uri)
      if (!canOpen) {
        Alert.alert('Unable to open file', 'Your device could not open this document path.')
        return
      }
      await Linking.openURL(uri)
    } catch {
      Alert.alert('Unable to open file', 'Could not open this document.')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel='Back'
          >
            <MaterialIcons name='arrow-back' size={22} color={CLTheme.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documents & Insights</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          testID='documents-add-button'
          accessibilityLabel='Add document'
        >
          <MaterialIcons name='add' size={22} color={CLTheme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name='search' size={18} color={CLTheme.text.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholder='Search versions, companies...'
          placeholderTextColor={CLTheme.text.muted}
          testID='documents-search-input'
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsRow}
        contentContainerStyle={styles.statsContent}
      >
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Applications</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{applicationsCount}</Text>
            <Text style={styles.statMeta}>{recentUploads > 0 ? `+${recentUploads} this week` : 'No new uploads'}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Interview Rate</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{interviewRate}%</Text>
            <Text style={styles.statMeta}>From stored docs</Text>
          </View>
        </View>
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'resume' && styles.filterChipActive]}
          onPress={() => setFilterType('resume')}
          testID='filter-resumes-chip'
        >
          <Text style={[styles.filterChipText, filterType === 'resume' && styles.filterChipTextActive]}>Resumes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'coverLetter' && styles.filterChipActive]}
          onPress={() => setFilterType('coverLetter')}
          testID='filter-coverletters-chip'
        >
          <Text style={[styles.filterChipText, filterType === 'coverLetter' && styles.filterChipTextActive]}>
            Cover Letters
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => setSortMode(prev => (prev === 'date' ? 'conversion' : 'date'))}>
          <Text style={styles.sortButtonText}>Sort by: {sortMode === 'date' ? 'Date' : 'Conversion'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <MaterialIcons name='folder-open' size={28} color={CLTheme.text.muted} />
            <Text style={styles.emptyStateTitle}>No documents yet</Text>
            <Text style={styles.emptyStateBody}>
              Add a resume or cover letter with the + button to track performance insights.
            </Text>
            <TouchableOpacity style={styles.emptyStateAction} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyStateActionText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDocuments.map(document => {
            const statusMeta = STATUS_META[document.status]
            return (
              <View key={document.id} style={styles.documentCard} testID={`document-card-${document.id}`}>
                <View style={styles.documentTop}>
                  <View style={styles.documentLeft}>
                    <View style={styles.documentIconWrap}>
                      <MaterialIcons name={resolveDocumentIcon(document.type)} size={20} color={CLTheme.accent} />
                    </View>
                    <View style={styles.documentMeta}>
                      <Text style={styles.documentTitle} numberOfLines={1}>
                        {document.name}
                      </Text>
                      <Text style={styles.documentSubtitle} numberOfLines={1}>
                        {document.targetLabel || `${document.type === 'resume' ? 'Resume' : 'Cover Letter'} upload`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Document', document.name)}>
                    <MaterialIcons name='more-vert' size={18} color={CLTheme.text.muted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.documentBottom}>
                  <View style={styles.documentBottomLeft}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusMeta.backgroundColor, borderColor: statusMeta.borderColor },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: statusMeta.textColor }]}>{statusMeta.label}</Text>
                    </View>
                    <Text style={styles.documentUpdated}>{getRelativeUpdatedLabel(document.updatedAt)}</Text>
                  </View>
                  <View style={styles.conversionWrap}>
                    <MaterialIcons name='show-chart' size={15} color={CLTheme.status.success} />
                    <Text style={styles.conversionText}>{Math.round(document.conversionRate * 100)}% Conv.</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => handleOpenDocument(document.uri)}
                    testID={`open-document-${document.id}`}
                  >
                    <MaterialIcons name='open-in-new' size={14} color={CLTheme.text.secondary} />
                    <Text style={styles.cardActionText}>Open</Text>
                  </TouchableOpacity>
                  {document.type === 'resume' ? (
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => setCareerSetup({ sourceResumeName: document.name })}
                      testID={`use-resume-${document.id}`}
                    >
                      <MaterialIcons name='verified' size={14} color={CLTheme.accent} />
                      <Text style={styles.cardActionText}>Use as Source</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => cycleDocumentStatus(document)}
                    testID={`status-cycle-${document.id}`}
                  >
                    <MaterialIcons name='autorenew' size={14} color={CLTheme.text.secondary} />
                    <Text style={styles.cardActionText}>Next Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardActionButton, styles.cardActionDelete]}
                    onPress={() => removeCareerDocument(document.id)}
                    testID={`delete-document-${document.id}`}
                  >
                    <MaterialIcons name='delete-outline' size={14} color={CLTheme.status.danger} />
                    <Text style={[styles.cardActionText, styles.cardActionDeleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType='fade' onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => null} testID='documents-upload-modal'>
            <Text style={styles.modalTitle}>Add Document</Text>
            <Text style={styles.modalBody}>Choose the file type you want to upload.</Text>
            <TouchableOpacity
              style={styles.modalAction}
              onPress={() => handleUploadDocument('resume')}
              testID='documents-upload-resume'
            >
              <MaterialIcons name='description' size={18} color={CLTheme.accent} />
              <Text style={styles.modalActionText}>Upload Resume (PDF, DOC, DOCX)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalAction}
              onPress={() => handleUploadDocument('coverLetter')}
              testID='documents-upload-coverLetter'
            >
              <MaterialIcons name='article' size={18} color={CLTheme.accent} />
              <Text style={styles.modalActionText}>Upload Cover Letter (PDF, DOC, DOCX)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  searchWrap: {
    marginHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: CLTheme.text.primary,
    fontSize: 14,
  },
  statsRow: {
    marginTop: 12,
    maxHeight: 96,
  },
  statsContent: {
    paddingHorizontal: 14,
    gap: 10,
  },
  statCard: {
    width: 168,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: CLTheme.card,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: CLTheme.text.muted,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  statValueRow: {
    marginTop: 10,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: CLTheme.text.primary,
  },
  statMeta: {
    fontSize: 11,
    color: CLTheme.text.secondary,
    fontWeight: '500',
  },
  filterRow: {
    marginTop: 10,
    maxHeight: 42,
  },
  filterContent: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: 'rgba(13, 108, 242, 0.7)',
    backgroundColor: 'rgba(13, 108, 242, 0.2)',
  },
  filterChipText: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: CLTheme.accent,
  },
  listHeader: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderTitle: {
    fontSize: 12,
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  sortButtonText: {
    color: CLTheme.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 10,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    backgroundColor: CLTheme.card,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  emptyStateTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  emptyStateBody: {
    marginTop: 6,
    textAlign: 'center',
    color: CLTheme.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 300,
  },
  emptyStateAction: {
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: CLTheme.accent,
  },
  emptyStateActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  documentCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    backgroundColor: CLTheme.card,
    padding: 12,
  },
  documentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  documentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentMeta: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  documentSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: CLTheme.text.secondary,
  },
  documentBottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
    paddingRight: 6,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  documentUpdated: {
    fontSize: 11,
    color: CLTheme.text.muted,
  },
  conversionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  conversionText: {
    fontSize: 11,
    color: CLTheme.status.success,
    fontWeight: '700',
  },
  cardActions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardActionButton: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CLTheme.background,
  },
  cardActionText: {
    fontSize: 11,
    color: CLTheme.text.secondary,
    fontWeight: '600',
  },
  cardActionDelete: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardActionDeleteText: {
    color: CLTheme.status.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.74)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  modalBody: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
    color: CLTheme.text.secondary,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: CLTheme.background,
    marginBottom: 8,
  },
  modalActionText: {
    flex: 1,
    color: CLTheme.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: CLTheme.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
})
