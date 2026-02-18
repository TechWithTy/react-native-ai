import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import { CLTheme } from './theme'
import { useUserProfileStore } from '../../store/userProfileStore'
import { useCareerSetupStore } from '../../store/careerSetup'
import { useCreditsStore } from '../../store/creditsStore'
import {
  LinkedInSectionTab,
  LinkedInSourceType,
  LinkedInToneMode,
  useLinkedInKitStore,
} from '../../store/linkedInKitStore'

type LinkedInKitProps = {
  navigation?: {
    goBack?: () => void
  }
}

const SECTION_TABS: LinkedInSectionTab[] = ['Headline', 'About Me', 'Experience', 'Skills']
const PROFILE_STRENGTH = 85
const RESUME_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const buildOptimizedCopy = (tone: LinkedInToneMode) => {
  if (tone === 'Technical') {
    return 'Senior Software Engineer | React, TypeScript, and Frontend Architecture | Building High-Performance UI Systems | Mentoring Engineering Talent'
  }
  return 'Senior Software Engineer | React & TypeScript Specialist | Architecting Scalable Frontend Solutions | Mentoring Engineering Talent'
}

export function LinkedInKitScreen({ navigation }: LinkedInKitProps = {}) {
  const [isCopied, setIsCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [setupSourceType, setSetupSourceType] = useState<LinkedInSourceType>('resume')
  const [selectedResume, setSelectedResume] = useState<string | null>(null)

  const { sourceResumeName, baselineResumeName, setCareerSetup } = useCareerSetupStore()
  const { linkedInConnected, linkedInKitWins, setLinkedInKitWins, setProfile } = useUserProfileStore()
  const { balance, getCost, spendCredits } = useCreditsStore()
  const { activeSession, createSession, updateSession, clearSession } = useLinkedInKitStore()
  const linkedInKitCost = getCost('linkedInOptimize')

  const availableResumes = useMemo(
    () => Array.from(new Set([sourceResumeName, baselineResumeName].filter((item): item is string => Boolean(item)))),
    [sourceResumeName, baselineResumeName]
  )

  useEffect(() => {
    if (activeSession?.sourceType === 'resume' && activeSession.resumeName) {
      setSelectedResume(activeSession.resumeName)
      return
    }
    if (!selectedResume && availableResumes.length > 0) {
      setSelectedResume(availableResumes[0])
    }
  }, [activeSession, availableResumes, selectedResume])

  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setIsCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [isCopied])

  const tone: LinkedInToneMode = activeSession?.tone ?? 'Concise'
  const activeTab: LinkedInSectionTab = activeSession?.activeTab ?? 'Headline'
  const optimizedSummary = activeSession?.optimizedSummary ?? buildOptimizedCopy(tone)
  const pendingWins = Object.values(linkedInKitWins).filter(done => !done).length
  const canGenerate = balance >= linkedInKitCost

  const toggleQuickWin = (key: keyof typeof linkedInKitWins) => {
    setLinkedInKitWins({
      ...linkedInKitWins,
      [key]: !linkedInKitWins[key],
    })
  }

  const updateTone = (nextTone: LinkedInToneMode) => {
    if (!activeSession || activeSession.tone === nextTone) return
    updateSession({
      tone: nextTone,
      optimizedSummary: buildOptimizedCopy(nextTone),
    })
  }

  const updateTab = (nextTab: LinkedInSectionTab) => {
    if (!activeSession || activeSession.activeTab === nextTab) return
    updateSession({ activeTab: nextTab })
  }

  const handleCopyOptimized = async () => {
    try {
      await Clipboard.setStringAsync(optimizedSummary)
      setIsCopied(true)
    } catch {
      Alert.alert('Copy failed', 'Unable to copy text right now.')
    }
  }

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: RESUME_FILE_TYPES,
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) return

      const resumeName = result.assets[0]?.name || 'Uploaded_Resume'
      setCareerSetup({ sourceResumeName: resumeName })
      setSelectedResume(resumeName)
      setSetupSourceType('resume')
    } catch {
      Alert.alert('Upload failed', 'Could not open resume picker.')
    }
  }

  const handleConnectLinkedIn = () => {
    setProfile({ linkedInConnected: true })
    setSetupSourceType('linkedin')
  }

  const handleGenerateKit = () => {
    if (setupSourceType === 'resume' && !selectedResume) {
      Alert.alert('Resume required', 'Select or upload a resume before generating your LinkedIn kit.')
      return
    }
    if (setupSourceType === 'linkedin' && !linkedInConnected) {
      Alert.alert('Connect LinkedIn', 'Connect LinkedIn to generate your kit from profile data.')
      return
    }
    if (!spendCredits('linkedInOptimize', 'LinkedIn Kit Generation')) {
      Alert.alert(
        'Not enough credits',
        `LinkedIn Kit requires ${linkedInKitCost} credits. Current balance: ${balance}.`
      )
      return
    }

    setIsGenerating(true)
    const sourceLabel = setupSourceType === 'resume' ? selectedResume || 'Selected Resume' : 'LinkedIn Profile'

    createSession({
      sourceType: setupSourceType,
      sourceLabel,
      resumeName: setupSourceType === 'resume' ? selectedResume : null,
      tone: 'Concise',
      activeTab: 'Headline',
      optimizedSummary: buildOptimizedCopy('Concise'),
      creditsUsed: linkedInKitCost,
    })

    setIsGenerating(false)
    setIsCopied(false)
  }

  const renderSetupFlow = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>
          {setupSourceType === 'linkedin' ? 'Optimize your LinkedIn' : 'Set up your LinkedIn Kit'}
        </Text>
        <Text style={styles.setupSubtitle}>
          {setupSourceType === 'linkedin'
            ? `Connect your LinkedIn profile and generate optimization suggestions. This uses ${linkedInKitCost} AI credits.`
            : `Choose a source before loading optimizations. Generating this kit uses ${linkedInKitCost} AI credits.`}
        </Text>

        <View style={styles.sourceToggle}>
          <TouchableOpacity
            style={[styles.sourceToggleButton, setupSourceType === 'resume' && styles.sourceToggleButtonActive]}
            onPress={() => setSetupSourceType('resume')}
          >
            <Text style={[styles.sourceToggleText, setupSourceType === 'resume' && styles.sourceToggleTextActive]}>
              Resume
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sourceToggleButton, setupSourceType === 'linkedin' && styles.sourceToggleButtonActive]}
            onPress={() => setSetupSourceType('linkedin')}
          >
            <Text style={[styles.sourceToggleText, setupSourceType === 'linkedin' && styles.sourceToggleTextActive]}>
              LinkedIn
            </Text>
          </TouchableOpacity>
        </View>

        {setupSourceType === 'resume' ? (
          <>
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Available resumes</Text>
              {availableResumes.length === 0 ? (
                <Text style={styles.setupHintText}>No saved resumes yet. Upload one below.</Text>
              ) : (
                availableResumes.map(resume => {
                  const active = selectedResume === resume
                  return (
                    <TouchableOpacity
                      key={resume}
                      style={[styles.resumeRow, active && styles.resumeRowActive]}
                      onPress={() => {
                        setSelectedResume(resume)
                        setSetupSourceType('resume')
                      }}
                    >
                      <MaterialIcons
                        name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={18}
                        color={active ? CLTheme.accent : CLTheme.text.muted}
                      />
                      <Text style={styles.resumeRowText}>{resume}</Text>
                    </TouchableOpacity>
                  )
                })
              )}
            </View>

            <TouchableOpacity style={styles.uploadResumeButton} onPress={handleUploadResume}>
              <MaterialIcons name='upload-file' size={18} color={CLTheme.accent} />
              <Text style={styles.uploadResumeButtonText}>Upload Resume</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.setupSection}>
            <Text style={styles.setupSectionTitle}>LinkedIn connection</Text>
            <Text style={styles.setupHintText}>
              Use your LinkedIn profile as the optimization source for this session.
            </Text>
            {linkedInConnected ? (
              <View style={styles.connectedBadge}>
                <MaterialIcons name='check-circle' size={16} color={CLTheme.status.success} />
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.connectLinkedInButton} onPress={handleConnectLinkedIn}>
                <MaterialIcons name='link' size={16} color={CLTheme.accent} />
                <Text style={styles.connectLinkedInButtonText}>Connect LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.creditRow}>
          <Text style={styles.creditLabel}>Credits</Text>
          <Text style={styles.creditValue}>{balance}</Text>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
          onPress={handleGenerateKit}
          accessibilityLabel='Generate LinkedIn Kit'
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.generateButtonText}>Generate LinkedIn Kit ({linkedInKitCost} credits)</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation?.goBack?.()}>
            <MaterialIcons name='arrow-back' size={22} color={CLTheme.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LinkedIn Kit</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => clearSession()}>
            <MaterialIcons name='restart-alt' size={20} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        {activeSession ? (
          <View style={styles.strengthRow}>
            <View style={styles.strengthLabelRow}>
              <Text style={styles.strengthLabel}>Profile Strength</Text>
              <Text style={styles.strengthValue}>{PROFILE_STRENGTH}%</Text>
            </View>
            <View style={styles.strengthTrack}>
              <View style={[styles.strengthFill, { width: `${PROFILE_STRENGTH}%` }]} />
            </View>
            <Text style={styles.sourceInfoText}>Source: {activeSession.sourceLabel}</Text>
          </View>
        ) : null}
      </View>

      {!activeSession ? (
        renderSetupFlow()
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Tone Strategy</Text>
            <View style={styles.toneContainer}>
              {(['Concise', 'Technical'] as LinkedInToneMode[]).map(item => {
                const active = tone === item
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.toneButton, active && styles.toneButtonActive]}
                    onPress={() => updateTone(item)}
                  >
                    <Text style={[styles.toneButtonText, active && styles.toneButtonTextActive]}>{item}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={styles.tabRow}>
            {SECTION_TABS.map(tab => {
              const active = tab === activeTab
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => updateTab(tab)}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{tab}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.compareSection}>
            <View style={styles.compareLabelRow}>
              <View style={styles.compareIndex}>
                <Text style={styles.compareIndexText}>1</Text>
              </View>
              <Text style={styles.compareLabel}>From Resume</Text>
            </View>
            <View style={styles.sourceCard}>
              <Text style={styles.sourceText}>
                Senior Software Engineer handling frontend tasks. Using React and Typescript for daily work. Managing
                a team of 3 juniors.
              </Text>
            </View>
          </View>

          <View style={styles.compareSection}>
            <View style={styles.compareLabelRowBetween}>
              <View style={styles.compareLabelRow}>
                <View style={[styles.compareIndex, styles.compareIndexActive]}>
                  <Text style={[styles.compareIndexText, styles.compareIndexTextActive]}>2</Text>
                </View>
                <Text style={[styles.compareLabel, styles.compareLabelActive]}>Optimized for LinkedIn</Text>
              </View>
              <View style={styles.impactBadge}>
                <Text style={styles.impactBadgeText}>High Impact</Text>
              </View>
            </View>

            <View style={styles.optimizedCard}>
              <Text style={styles.optimizedText}>{optimizedSummary}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyOptimized}
                accessibilityLabel='Copy optimized LinkedIn text'
              >
                <MaterialIcons name='content-copy' size={14} color={CLTheme.accent} />
                <Text style={styles.copyButtonText}>{isCopied ? 'Copied' : 'Copy to Clipboard'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.quickWinsHeader}>
              <Text style={styles.quickWinsTitle}>Quick Wins</Text>
              <Text style={styles.quickWinsPending}>{pendingWins} pending</Text>
            </View>

            <TouchableOpacity style={[styles.quickWinItem, styles.quickWinDone]} onPress={() => toggleQuickWin('topSkills')}>
              <View style={[styles.quickWinCheck, linkedInKitWins.topSkills && styles.quickWinCheckActive]}>
                {linkedInKitWins.topSkills ? <MaterialIcons name='check' size={12} color='#fff' /> : null}
              </View>
              <Text style={[styles.quickWinText, linkedInKitWins.topSkills && styles.quickWinTextDone]}>Add top 5 skills</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickWinItem} onPress={() => toggleQuickWin('openToWork')}>
              <View style={[styles.quickWinCheck, linkedInKitWins.openToWork && styles.quickWinCheckActive]}>
                {linkedInKitWins.openToWork ? <MaterialIcons name='check' size={12} color='#fff' /> : null}
              </View>
              <View style={styles.quickWinContent}>
                <Text style={styles.quickWinText}>Enable "Open to Work"</Text>
                <Text style={styles.quickWinSubText}>Visible to recruiters only</Text>
              </View>
              <MaterialIcons name='chevron-right' size={18} color={CLTheme.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickWinItem} onPress={() => toggleQuickWin('banner')}>
              <View style={[styles.quickWinCheck, linkedInKitWins.banner && styles.quickWinCheckActive]}>
                {linkedInKitWins.banner ? <MaterialIcons name='check' size={12} color='#fff' /> : null}
              </View>
              <View style={styles.quickWinContent}>
                <Text style={styles.quickWinText}>Upload background banner</Text>
                <Text style={styles.quickWinSubText}>Increases profile views by 11x</Text>
              </View>
              <MaterialIcons name='chevron-right' size={18} color={CLTheme.text.muted} />
            </TouchableOpacity>
          </View>

          <ImageBackground
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGjHevytjJtzm2ivfR1wAWxwaA0QOmXltxhImOgaav0uyYk6KD02RWG-xSlqySCVrb3fWob_ryuWbwBGn1v8-gn7qxBJKYInIBpYTEtwtDZW6cykRBOzovH9ZFSmswjnHITSu_eURJPS9s9GpiBEs2MPrBJPXcfw3rMj_WM9lRZLgaRnqXj5Dn2nYtJaruUfSD_LOuu8fVWcLVy4sc6y973btuG1Yc0_FiOyMuFBYTW-PQ_wu63Y4m_hCexVj9QZTBnAnIF0m1MlvV',
            }}
            style={styles.learningCard}
            imageStyle={styles.learningImage}
          >
            <View style={styles.learningOverlay} />
            <View style={styles.learningContent}>
              <View style={styles.learningTextWrap}>
                <Text style={styles.learningTitle}>Unlock LinkedIn Mastery</Text>
                <Text style={styles.learningSubtitle}>Watch our 5-min guide on optimizing for the algorithm.</Text>
              </View>
              <TouchableOpacity style={styles.playButton}>
                <MaterialIcons name='play-arrow' size={22} color='#fff' />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <MaterialIcons name='dashboard' size={22} color={CLTheme.text.muted} />
          <Text style={styles.navText}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialIcons name='edit-note' size={22} color={CLTheme.accent} />
          <Text style={styles.navTextActive}>Optimize</Text>
        </View>
        <View style={styles.navItem}>
          <View style={styles.aiCoachButton}>
            <MaterialIcons name='smart-toy' size={20} color='#fff' />
          </View>
          <Text style={styles.navText}>AI Coach</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialIcons name='work-outline' size={22} color={CLTheme.text.muted} />
          <Text style={styles.navText}>Jobs</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialIcons name='person-outline' size={22} color={CLTheme.text.muted} />
          <Text style={styles.navText}>Profile</Text>
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
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    backgroundColor: CLTheme.background,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  strengthRow: {
    gap: 6,
  },
  strengthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  strengthValue: {
    color: CLTheme.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  sourceInfoText: {
    color: CLTheme.text.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  strengthTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: CLTheme.border,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    backgroundColor: CLTheme.accent,
    borderRadius: 999,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 120,
  },
  setupCard: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 14,
    padding: 16,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  setupSubtitle: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
  },
  sourceToggle: {
    flexDirection: 'row',
    backgroundColor: '#1f2b3d',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  sourceToggleButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  sourceToggleButtonActive: {
    backgroundColor: CLTheme.accent,
  },
  sourceToggleText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sourceToggleTextActive: {
    color: '#fff',
  },
  setupSection: {
    marginBottom: 12,
  },
  setupSectionTitle: {
    color: CLTheme.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  setupHintText: {
    color: CLTheme.text.secondary,
    fontSize: 13,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: CLTheme.background,
  },
  resumeRowActive: {
    borderColor: CLTheme.accent,
    backgroundColor: 'rgba(13, 108, 242, 0.08)',
  },
  resumeRowText: {
    color: CLTheme.text.primary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  uploadResumeButton: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CLTheme.accent,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 108, 242, 0.08)',
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadResumeButtonText: {
    color: CLTheme.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  connectLinkedInButton: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    backgroundColor: CLTheme.background,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectLinkedInButtonText: {
    color: CLTheme.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  connectedBadge: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectedBadgeText: {
    color: CLTheme.status.success,
    fontSize: 13,
    fontWeight: '700',
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  creditLabel: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  creditValue: {
    color: CLTheme.text.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  generateButton: {
    backgroundColor: CLTheme.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  generateButtonDisabled: {
    opacity: 0.45,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  toneContainer: {
    backgroundColor: '#1f2b3d',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
  },
  toneButton: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    paddingVertical: 8,
  },
  toneButtonActive: {
    backgroundColor: CLTheme.accent,
  },
  toneButtonText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
    fontWeight: '600',
  },
  toneButtonTextActive: {
    color: '#fff',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tabChip: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: CLTheme.card,
  },
  tabChipActive: {
    backgroundColor: CLTheme.accent,
    borderColor: CLTheme.accent,
  },
  tabChipText: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: '#fff',
  },
  compareSection: {
    marginBottom: 14,
  },
  compareLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  compareLabelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compareIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#203247',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareIndexActive: {
    backgroundColor: 'rgba(13, 108, 242, 0.2)',
  },
  compareIndexText: {
    color: CLTheme.text.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  compareIndexTextActive: {
    color: CLTheme.accent,
  },
  compareLabel: {
    color: CLTheme.text.secondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  compareLabelActive: {
    color: CLTheme.accent,
  },
  sourceCard: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    padding: 14,
  },
  sourceText: {
    color: CLTheme.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  impactBadge: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  impactBadgeText: {
    color: CLTheme.status.success,
    fontSize: 10,
    fontWeight: '700',
  },
  optimizedCard: {
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderLeftColor: CLTheme.accent,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
  },
  optimizedText: {
    color: CLTheme.text.primary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  copyButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 108, 242, 0.14)',
  },
  copyButtonText: {
    color: CLTheme.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  quickWinsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickWinsTitle: {
    color: CLTheme.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  quickWinsPending: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  quickWinItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  quickWinDone: {
    opacity: 0.75,
  },
  quickWinCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: CLTheme.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  quickWinCheckActive: {
    backgroundColor: CLTheme.accent,
    borderColor: CLTheme.accent,
  },
  quickWinContent: {
    flex: 1,
  },
  quickWinText: {
    color: CLTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickWinTextDone: {
    color: CLTheme.text.secondary,
    textDecorationLine: 'line-through',
  },
  quickWinSubText: {
    color: CLTheme.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  learningCard: {
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#10192b',
  },
  learningImage: {
    resizeMode: 'cover',
  },
  learningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 23, 34, 0.72)',
  },
  learningContent: {
    flex: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  learningTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  learningTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  learningSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navItem: {
    alignItems: 'center',
    minWidth: 54,
    gap: 2,
  },
  navText: {
    color: CLTheme.text.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  navTextActive: {
    color: CLTheme.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  aiCoachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 3,
    borderColor: CLTheme.background,
  },
})
