import * as React from 'react'
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { CREDIT_COSTS, useCreditsStore } from '../../../store/creditsStore'
import { JobEntry, useJobTrackerStore } from '../../../store/jobTrackerStore'
import { CLTheme } from '../theme'

const RESUMES = [
  {
    id: 'r1',
    title: 'Product Design V4',
    subtitle: 'Last edited 2d ago',
    content:
      'EXPERIENCE\n\nSenior Product Designer | Tech Co.\n- Led design system overhaul\n- Increased conversion by 15%',
  },
  {
    id: 'r2',
    title: 'UX Engineer Specialist',
    subtitle: 'Last edited 5d ago',
    content:
      'EXPERIENCE\n\nUX Engineer | Startup Inc.\n- Built accessible component library\n- Prototyped complex interactions with React Native',
  },
]

const COVER_LETTERS = [
  {
    id: 'c1',
    title: 'AI Generated Tailored',
    subtitle: 'Relevance: High • 300 words',
    content:
      'Dear Hiring Manager,\n\nI am writing to express my strong interest in this role. My background in...',
  },
  {
    id: 'c2',
    title: 'Standard Cover Letter',
    subtitle: 'General Purpose',
    content:
      'To whom it may concern,\n\nPlease accept this letter and the enclosed resume as an expression of my interest...',
  },
]

type DocumentOption = {
  id: string
  title: string
  subtitle: string
  content: string
}

type ApplicationPrepOptionsProps = {
  job: JobEntry | null
  onClose?: () => void
  onApplied?: () => void
  showHeader?: boolean
  showCancel?: boolean
  initialTab?: 'simple' | 'advanced'
}

export function ApplicationPrepOptions({
  job,
  onClose,
  onApplied,
  showHeader = true,
  showCancel = true,
  initialTab = 'simple',
}: ApplicationPrepOptionsProps) {
  const { updateJobStatus, updateJobAction } = useJobTrackerStore(state => state)
  const { balance: creditBalance, canAfford, spendCredits } = useCreditsStore()
  const applyCost = CREDIT_COSTS.aiApplicationSubmit
  const canAffordApply = canAfford('aiApplicationSubmit')
  const creditColor = creditBalance > 30 ? '#10b981' : creditBalance > 10 ? '#f59e0b' : '#ef4444'

  const [applyTab, setApplyTab] = React.useState<'simple' | 'advanced'>(initialTab)
  const [selectedResume, setSelectedResume] = React.useState<DocumentOption>(RESUMES[0])
  const [selectedCoverLetter, setSelectedCoverLetter] = React.useState<DocumentOption>(COVER_LETTERS[0])
  const [activeDropdown, setActiveDropdown] = React.useState<'resume' | 'coverLetter' | null>(null)
  const [previewDoc, setPreviewDoc] = React.useState<DocumentOption | null>(null)

  const fillAnim = React.useRef(new Animated.Value(0)).current
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const isHoldStarted = React.useRef(false)

  React.useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
    }
  }, [])

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const completeApply = (successTitle: string, successMessage: string) => {
    Alert.alert(successTitle, successMessage)
    onApplied?.()
  }

  const markJobAppliedAndQueueNextTask = () => {
    if (!job) return
    updateJobStatus(job.id, 'Applied')
    updateJobAction(job.id, 'Follow up', 'in 3 days')
  }

  const handleStandardApply = () => {
    markJobAppliedAndQueueNextTask()
    completeApply(
      'Application Logged!',
      `${job?.role || 'Job'} at ${job?.company || 'Company'} marked as Applied.`
    )
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
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return
      if (job) {
        spendCredits('aiApplicationSubmit', `AI Application for ${job.company}`)
      }
      markJobAppliedAndQueueNextTask()
      completeApply(
        'Application Submitted',
        'Good luck! The AI has processed your application.'
      )
    })
  }

  const handleHoldEnd = () => {
    Animated.timing(fillAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  const handleActionPressIn = () => {
    isHoldStarted.current = false
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
    }

    holdTimerRef.current = setTimeout(() => {
      isHoldStarted.current = true
      handleHoldStart()
    }, 300)
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

  const handleGenerateResume = () => {
    if (!canAfford('resumeTailor')) {
      Alert.alert('Insufficient Credits', `You need ${CREDIT_COSTS.resumeTailor} credits to generate a resume.`)
      return
    }
    spendCredits('resumeTailor', `Tailored resume for ${job?.company || 'job'}`)
    Alert.alert(
      'Resume Generated',
      `AI-tailored resume created for ${job?.role || 'this role'}.\nCost: ${CREDIT_COSTS.resumeTailor} credits`
    )
  }

  const handleGenerateCover = () => {
    if (!canAfford('coverLetterGen')) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${CREDIT_COSTS.coverLetterGen} credits to generate a cover letter.`
      )
      return
    }
    spendCredits('coverLetterGen', `Cover letter for ${job?.company || 'job'}`)
    Alert.alert(
      'Cover Letter Generated',
      `AI cover letter created for ${job?.role || 'this role'}.\nCost: ${CREDIT_COSTS.coverLetterGen} credits`
    )
  }

  const handleAdvancedSubmit = () => {
    markJobAppliedAndQueueNextTask()
    completeApply(
      'Application Logged!',
      `${job?.role || 'Job'} at ${job?.company || 'Company'} marked as Applied.`
    )
  }

  const handleAdvancedPress = () => {
    handleAdvancedSubmit()
  }

  const renderDocumentSelector = (
    type: 'resume' | 'coverLetter',
    selected: DocumentOption,
    options: DocumentOption[],
    onSelect: (item: DocumentOption) => void
  ) => {
    const isOpen = activeDropdown === type

    return (
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>{type === 'resume' ? 'Resume' : 'Cover Letter'}</Text>

        {!isOpen ? (
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setActiveDropdown(type)}
            >
              <View style={styles.iconCircle}>
                <Feather name={type === 'resume' ? 'file-text' : 'file'} size={18} color='#fff' />
              </View>
              <View>
                <Text style={styles.selectorTitle}>{selected.title}</Text>
                <Text style={styles.selectorSub}>{selected.subtitle}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.selectorActions}>
              <TouchableOpacity
                onPress={() => Alert.alert('Downloading', `Downloading ${selected.title}...`)}
                style={styles.iconBtn}
              >
                <Feather name='download' size={20} color={CLTheme.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPreviewDoc(selected)} style={styles.iconBtn}>
                <Feather name='eye' size={20} color={CLTheme.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveDropdown(type)}>
                <Feather name='chevron-down' size={20} color={CLTheme.text.muted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.dropdownContainer}>
            {options.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownRow,
                  item.id === selected.id && styles.dropdownRowActive,
                ]}
                onPress={() => {
                  onSelect(item)
                  setActiveDropdown(null)
                }}
              >
                <View style={styles.dropdownLeft}>
                  <View style={[styles.iconCircle, item.id !== selected.id && styles.iconCircleMuted]}>
                    <Feather name={type === 'resume' ? 'file-text' : 'file'} size={18} color='#fff' />
                  </View>
                  <View>
                    <Text style={styles.selectorTitle}>{item.title}</Text>
                    <Text style={styles.selectorSub}>{item.subtitle}</Text>
                  </View>
                </View>
                {item.id === selected.id ? <Feather name='check' size={20} color={CLTheme.accent} /> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.dropdownClose} onPress={() => setActiveDropdown(null)}>
              <Feather name='chevron-up' size={20} color={CLTheme.text.muted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  const suggestedAnswers = [
    {
      q: 'Why do you want to work here?',
      a: job
        ? `I've always admired ${job.company}'s work in this space. My background aligns strongly with this ${job.role} role.`
        : 'My background aligns strongly with this role and team goals.',
    },
    { q: 'Salary Expectations?', a: '$180k - $210k base salary', mono: true },
    { q: 'Notice Period?', a: 'Available to start immediately.' },
  ]

  return (
    <View style={styles.applyContainer}>
      {showHeader ? (
        <View style={styles.applyTitleRow}>
          <Text style={styles.applyHeader}>Prepare Application</Text>
          {onClose ? (
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <MaterialIcons name='close' size={20} color='#94a3b8' />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={styles.applyTabBar}>
        <TouchableOpacity
          style={[styles.applyTab, applyTab === 'simple' && styles.applyTabActive]}
          onPress={() => setApplyTab('simple')}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyTabText, applyTab === 'simple' && styles.applyTabTextActive]}>
            Quick Apply
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyTab, applyTab === 'advanced' && styles.applyTabActive]}
          onPress={() => setApplyTab('advanced')}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyTabText, applyTab === 'advanced' && styles.applyTabTextActive]}>
            Advanced
          </Text>
        </TouchableOpacity>
      </View>

      {applyTab === 'simple' ? (
        <>
          <Text style={styles.applySubheader}>Select your resume and cover letter to apply.</Text>
          {renderDocumentSelector('resume', selectedResume, RESUMES, setSelectedResume)}
          {renderDocumentSelector('coverLetter', selectedCoverLetter, COVER_LETTERS, setSelectedCoverLetter)}

          <View style={styles.aiActionsRow}>
            <TouchableOpacity style={styles.aiGenBtn} onPress={handleGenerateResume}>
              <Feather name='cpu' size={14} color='#0d6cf2' />
              <Text style={styles.aiGenBtnText}>AI Resume ({CREDIT_COSTS.resumeTailor}cr)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiGenBtn} onPress={handleGenerateCover}>
              <Feather name='cpu' size={14} color='#0d6cf2' />
              <Text style={styles.aiGenBtnText}>AI Cover ({CREDIT_COSTS.coverLetterGen}cr)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionArea}>
            <View style={styles.creditCostRow}>
              <View style={styles.creditLeft}>
                <Feather name='zap' size={14} color={creditColor} />
                <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
              </View>
              <Text style={styles.creditEstimate}>{applyCost}cr for AI features</Text>
            </View>

            <Text style={styles.quickApplyTapLabel}>Click to Quick Apply</Text>
            <Pressable
              testID='quick-apply-submit-button'
              onPressIn={handleActionPressIn}
              onPressOut={handleActionPressOut}
              style={({ pressed }) => [
                styles.holdBtnContainer,
                { backgroundColor: pressed ? '#1e293b' : '#334155' },
                !canAffordApply && { opacity: 0.8 },
              ]}
            >
              <Animated.View style={[styles.holdFill, { width: fillWidth }]} />
              <View style={styles.holdContent}>
                <Feather name='send' size={20} color='#fff' style={{ marginRight: 8 }} />
                <Text style={styles.holdText}>Applying with AI...</Text>
              </View>
              <View style={styles.holdOverlayText}>
                <Text style={styles.holdText}>Hold to Apply with AI</Text>
              </View>
            </Pressable>

            <Text style={styles.hintText}>AI application includes tailored resume & cover letter</Text>
          </View>
        </>
      ) : (
        <View style={styles.advancedContainer}>
          {job ? (
            <View style={styles.advJobCard}>
              <View style={[styles.advLogoBox, { backgroundColor: job.color || '#1e293b' }]}>
                {job.logo ? (
                  <Image source={{ uri: job.logo }} style={styles.advLogoImage} resizeMode='contain' />
                ) : (
                  <Text style={styles.advLogoFallback}>{job.company.charAt(0)}</Text>
                )}
              </View>
              <View style={styles.advJobMeta}>
                <View style={styles.advJobTitleRow}>
                  <Text style={styles.advJobTitle} numberOfLines={1}>
                    {job.role}
                  </Text>
                  <View style={styles.advMatchBadge}>
                    <Text style={styles.advMatchText}>{job.match ?? '94%'} Match</Text>
                  </View>
                </View>
                <Text style={styles.advCompanyLoc}>
                  {job.company} • {job.location}
                </Text>
              </View>
            </View>
          ) : null}

          <View>
            <View style={styles.advSectionHeader}>
              <Text style={styles.advSectionTitle}>TAILORED RESUME</Text>
              <TouchableOpacity style={styles.aiGenBtnSmall} onPress={handleGenerateResume}>
                <Feather name='cpu' size={12} color='#0d6cf2' />
                <Text style={styles.aiGenSmallText}>Generate ({CREDIT_COSTS.resumeTailor}cr)</Text>
              </TouchableOpacity>
            </View>
            {renderDocumentSelector('resume', selectedResume, RESUMES, setSelectedResume)}
          </View>

          <View>
            <View style={styles.advSectionHeader}>
              <Text style={styles.advSectionTitle}>COVER NOTE</Text>
              <TouchableOpacity style={styles.aiGenBtnSmall} onPress={handleGenerateCover}>
                <Feather name='cpu' size={12} color='#0d6cf2' />
                <Text style={styles.aiGenSmallText}>Generate ({CREDIT_COSTS.coverLetterGen}cr)</Text>
              </TouchableOpacity>
            </View>
            {renderDocumentSelector('coverLetter', selectedCoverLetter, COVER_LETTERS, setSelectedCoverLetter)}
          </View>

          <View>
            <Text style={[styles.advSectionTitle, { marginBottom: 10 }]}>SUGGESTED ANSWERS</Text>
            {suggestedAnswers.map((item, idx) => (
              <View key={idx} style={styles.advAnswerCard}>
                <View style={styles.answerHeader}>
                  <Text style={styles.advQuestionText}>{item.q}</Text>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={async () => {
                      await Clipboard.setStringAsync(item.a)
                      Alert.alert('Copied', 'Answer copied to clipboard')
                    }}
                  >
                    <MaterialIcons name='content-copy' size={16} color='#64748b' />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.advAnswerText, item.mono ? styles.monoAnswer : null]}>{item.a}</Text>
              </View>
            ))}
          </View>

          <View>
            <View style={styles.creditCostRow}>
              <View style={styles.creditLeft}>
                <Feather name='zap' size={14} color={creditColor} />
                <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
              </View>
              <Text style={styles.creditEstimate}>No AI credit charge for advanced submit</Text>
            </View>
            <View style={styles.advancedHintRow}>
              <MaterialIcons name='info-outline' size={14} color='#f59e0b' />
              <Text style={styles.advancedHintText}>Remember to attach the PDF manually!</Text>
            </View>
            <Text style={styles.advancedTapLabel}>Click to Approve</Text>
            <Pressable
              testID='advanced-apply-submit-button'
              style={styles.advCTABtn}
              onPress={handleAdvancedPress}
            >
              <MaterialIcons name='check-circle' size={20} color='#fff' />
              <Text style={styles.advCTAText}>Approve & Log Submission</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showCancel && onClose && applyTab !== 'simple' ? (
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={!!previewDoc} animationType='fade' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{previewDoc?.title}</Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.iconBtn}>
                <Feather name='x' size={24} color={CLTheme.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.previewText}>{previewDoc?.content}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  applyContainer: {
    paddingTop: 10,
  },
  applyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  applyHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: CLTheme.text.primary,
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
    alignItems: 'center',
    borderRadius: 8,
  },
  applyTabActive: {
    backgroundColor: '#0d6cf2',
  },
  applyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  applyTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  applySubheader: {
    fontSize: 13,
    color: CLTheme.text.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  detailSection: {
    marginTop: 16,
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
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  selectorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleMuted: {
    backgroundColor: CLTheme.border,
  },
  iconBtn: {
    padding: 4,
  },
  dropdownContainer: {
    backgroundColor: CLTheme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
    marginTop: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
  },
  dropdownRowActive: {
    backgroundColor: CLTheme.card,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownClose: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  aiActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
  actionArea: {
    marginTop: 28,
    gap: 8,
  },
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
  creditLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  holdBtnContainer: {
    height: 56,
    backgroundColor: '#334155',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickApplyTapLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.accent,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#10b981',
  },
  holdContent: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0,
  },
  holdText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  holdOverlayText: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  advancedContainer: {
    gap: 20,
  },
  advJobCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  advLogoImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  advLogoFallback: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  advJobMeta: {
    flex: 1,
  },
  advJobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advJobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  advMatchBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  advMatchText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  advCompanyLoc: {
    fontSize: 12,
    color: CLTheme.text.muted,
    marginTop: 2,
  },
  advSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  advSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  aiGenSmallText: {
    color: '#0d6cf2',
    fontSize: 11,
    fontWeight: '600',
  },
  advAnswerCard: {
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    gap: 6,
    marginBottom: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  advQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
    flex: 1,
  },
  advAnswerText: {
    fontSize: 13,
    color: CLTheme.text.muted,
    lineHeight: 18,
  },
  monoAnswer: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  advancedHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  advancedHintText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  advancedTapLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  advCTAText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  creditWarning: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    color: CLTheme.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CLTheme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
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
  previewBody: {
    padding: 20,
  },
  previewText: {
    color: CLTheme.text.primary,
    fontSize: 16,
    lineHeight: 24,
  },
})
