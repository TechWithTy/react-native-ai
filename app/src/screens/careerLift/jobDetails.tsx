import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Animated,
  Easing,
  Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { JobEntry, useJobTrackerStore } from '../../store/jobTrackerStore'
import { CREDIT_COSTS, useCreditsStore } from '../../store/creditsStore'
import { CLTheme } from './theme'

type JobDetailsRouteParams = {
  job?: JobEntry
}

type CompanyResearch = {
  about: string
  whyThisRole: string
  responsibilities: string[]
  mustHaves: string[]
  companyFacts: string[]
  researchSignals: string[]
  interviewFocus: string[]
}

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
    content: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in this role. My background in...',
  },
  {
    id: 'c2',
    title: 'Standard Cover Letter',
    subtitle: 'General Purpose',
    content:
      'To whom it may concern,\n\nPlease accept this letter and the enclosed resume as an expression of my interest...',
  },
]

const defaultJob: JobEntry = {
  id: 'fallback-job',
  company: 'Stellar AI',
  role: 'Senior Product Designer',
  location: 'Remote',
  status: 'Target',
  nextAction: 'Apply',
  nextActionDate: 'Today',
  match: '90%',
  tags: ['Remote', 'Full-time', '$150k - $200k'],
}

const companyResearchMap: Record<string, CompanyResearch> = {
  'Stellar AI': {
    about:
      'Stellar AI builds enterprise copilots for product and operations teams. The company emphasizes shipping quickly with clear UX around trust, transparency, and measurable impact.',
    whyThisRole:
      'This role owns end-to-end product design for AI-native workflows. You will partner with PM, research, and engineering to reduce friction in complex decision paths.',
    responsibilities: [
      'Lead user journeys from discovery to polished production flows',
      'Design AI-assisted interactions with strong feedback and confidence cues',
      'Collaborate with product and engineering on scoped, testable releases',
      'Run lightweight research and convert findings into prioritized updates',
    ],
    mustHaves: [
      '5+ years in product design across web and mobile',
      'Strong systems thinking and interaction design craft',
      'Experience designing internal tools or B2B workflows',
      'Ability to present design tradeoffs with clear rationale',
    ],
    companyFacts: ['Industry: Applied AI SaaS', 'Team size: 120-200', 'Work model: Remote-first'],
    researchSignals: [
      'Hiring emphasis suggests active product expansion and new vertical launches',
      'Role language prioritizes fast iteration and cross-functional influence',
      'Strong match for candidates with AI pattern literacy and UX writing depth',
    ],
    interviewFocus: [
      'Talk through a complex workflow you simplified',
      'Show your process for balancing speed and quality',
      'Prepare one case where data changed your design direction',
    ],
  },
  FinFlow: {
    about:
      'FinFlow provides workflow software for finance teams, focused on compliance-safe operations and clearer collaboration across accounting, risk, and leadership.',
    whyThisRole:
      'The role combines UX research leadership with product strategy. You will shape discovery across high-risk user journeys and influence roadmap bets.',
    responsibilities: [
      'Drive mixed-method research for critical finance workflows',
      'Synthesize insights into actionable product opportunities',
      'Define research operations standards and templates',
      'Partner with design and PM leaders on prioritization',
    ],
    mustHaves: [
      'Deep qualitative and quantitative research toolkit',
      'Experience in regulated or compliance-heavy domains',
      'Ability to communicate with executive stakeholders',
      'Strong storytelling with evidence-backed recommendations',
    ],
    companyFacts: ['Industry: Fintech workflow software', 'Team size: 300+', 'Work model: Hybrid'],
    researchSignals: [
      'Growth in research leadership indicates maturing product practice',
      'Likely focus on reducing user error and improving confidence',
      'Domain knowledge in risk/compliance can be a differentiator',
    ],
    interviewFocus: [
      'Bring one project that changed product direction',
      'Explain your framework for research prioritization',
      'Be ready to discuss stakeholder management under deadlines',
    ],
  },
  'Nexus Systems': {
    about:
      'Nexus Systems develops workflow infrastructure for enterprise teams managing cross-functional product delivery and strategic planning.',
    whyThisRole:
      'As Staff Product Manager, you will drive multi-team initiatives and define platform strategy that aligns customer needs with business outcomes.',
    responsibilities: [
      'Own roadmap for a high-impact platform area',
      'Translate customer pain points into measurable initiatives',
      'Coordinate engineering, design, and GTM across releases',
      'Track KPI movement and refine strategy with data',
    ],
    mustHaves: [
      'Proven experience leading platform or workflow products',
      'Strong cross-functional leadership and prioritization',
      'Comfort with ambiguous, multi-quarter planning',
      'Ability to drive execution without direct authority',
    ],
    companyFacts: ['Industry: Enterprise SaaS', 'Team size: 500+', 'Work model: Remote-friendly'],
    researchSignals: [
      'Role scope implies ownership over a strategic platform surface',
      'High comp band signals seniority and high autonomy expectations',
      'Likely interview focus on decision quality and execution discipline',
    ],
    interviewFocus: [
      'Prepare roadmap tradeoff examples with outcome metrics',
      'Show how you align teams around clear priorities',
      'Bring one case where you managed significant product risk',
    ],
  },
  Loomly: {
    about:
      'Loomly builds collaboration tools for content and marketing teams, with a focus on intuitive planning, approvals, and multi-channel publishing.',
    whyThisRole:
      'This contract role is focused on interaction design quality and usability improvements across core flows with fast iteration cycles.',
    responsibilities: [
      'Refine key interaction patterns and reduce friction points',
      'Build high-fidelity prototypes for rapid validation',
      'Collaborate with PM and engineers in weekly release cycles',
      'Contribute to consistency in the design system',
    ],
    mustHaves: [
      'Strong interaction design and prototyping fluency',
      'Experience with product teams shipping frequent updates',
      'Clear communication and async collaboration habits',
      'Portfolio evidence of usability improvements',
    ],
    companyFacts: ['Industry: Martech SaaS', 'Team size: 80-120', 'Work model: Fully remote'],
    researchSignals: [
      'Contract structure suggests immediate delivery needs',
      'Role likely measured by UX quality and cycle-time reduction',
      'Design system familiarity can accelerate onboarding',
    ],
    interviewFocus: [
      'Show before-and-after interaction improvements',
      'Explain your prototyping and validation workflow',
      'Discuss how you keep quality high under short timelines',
    ],
  },
}

function getCompanyResearch(companyName: string): CompanyResearch {
  return (
    companyResearchMap[companyName] ?? {
      about:
        'This company appears to be scaling product capabilities and investing in roles that improve user outcomes and execution quality.',
      whyThisRole:
        'The role requires strong collaboration, product judgment, and measurable impact across core user journeys.',
      responsibilities: [
        'Own high-impact user flows from concept to delivery',
        'Partner with cross-functional teams on priorities',
        'Translate user needs into clear, scoped execution plans',
      ],
      mustHaves: [
        'Strong communication and cross-functional collaboration',
        'Portfolio or experience demonstrating shipped outcomes',
        'Ability to prioritize effectively in fast-moving environments',
      ],
      companyFacts: ['Industry: Technology', 'Team size: Not specified', 'Work model: Flexible'],
      researchSignals: [
        'Hiring momentum usually indicates active roadmap investment',
        'Role language points to hands-on ownership expectations',
      ],
      interviewFocus: [
        'Prepare one end-to-end project story',
        'Bring examples of impact and decision-making under constraints',
      ],
    }
  )
}

function renderBulletItems(items: string[]) {
  return items.map(item => (
    <View key={item} style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{item}</Text>
    </View>
  ))
}

export function JobDetailsScreen() {
  const navigation = useNavigation<any>()
  const { savedJobIds, toggleSaveJob, thisWeek, nextUp, updateJobStatus, updateJobAction, addJob } = useJobTrackerStore()
  const { balance: creditBalance, canAfford, spendCredits } = useCreditsStore()
  const route = useRoute()
  const params = route.params as JobDetailsRouteParams | undefined
  const job = params?.job ?? defaultJob
  const isSaved = savedJobIds.includes(job.id)
  const applyCost = CREDIT_COSTS.aiApplicationSubmit
  const canAffordApply = canAfford('aiApplicationSubmit')
  const creditColor = creditBalance > 30 ? '#10b981' : creditBalance > 10 ? '#f59e0b' : '#ef4444'
  const research = getCompanyResearch(job.company)
  const [applyDrawerVisible, setApplyDrawerVisible] = useState(false)
  const [applyTab, setApplyTab] = useState<'simple' | 'advanced'>('simple')
  const [activeDropdown, setActiveDropdown] = useState<'resume' | 'coverLetter' | null>(null)
  const [selectedResume, setSelectedResume] = useState(RESUMES[0])
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(COVER_LETTERS[0])
  const [previewDoc, setPreviewDoc] = useState<{ title: string; content: string } | null>(null)
  const fillAnim = useRef(new Animated.Value(0)).current

  const closeApplyDrawer = () => {
    setApplyDrawerVisible(false)
    setActiveDropdown(null)
    setApplyTab('simple')
    fillAnim.setValue(0)
  }

  const handleCopyAnswer = async (text: string) => {
    await Clipboard.setStringAsync(text)
    Alert.alert('Copied', 'Answer copied to clipboard')
  }

  const markJobAppliedAndQueueNextTask = () => {
    const existsInTracker = [...thisWeek, ...nextUp].some(entry => entry.id === job.id)
    if (existsInTracker) {
      updateJobStatus(job.id, 'Applied')
      updateJobAction(job.id, 'Follow up', 'in 3 days')
      return
    }

    addJob({
      ...job,
      status: 'Applied',
      nextAction: 'Follow up',
      nextActionDate: 'in 3 days',
    })
  }

  const handleHoldStart = () => {
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) {
        return
      }

      const charged = spendCredits('aiApplicationSubmit', `AI apply: ${job.company}`)
      if (!charged) {
        Alert.alert('Not enough credits', 'Add more credits before applying with AI.')
        fillAnim.setValue(0)
        return
      }

      markJobAppliedAndQueueNextTask()

      Alert.alert('Application Submitted', 'Your application package was submitted with AI.')
      closeApplyDrawer()
    })
  }

  const handleHoldEnd = () => {
    Animated.timing(fillAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  const handleAdvancedSubmit = () => {
    markJobAppliedAndQueueNextTask()
    Alert.alert('Application Logged!', `${job.role} at ${job.company} marked as Applied.`)
    closeApplyDrawer()
  }

  const handleAdvancedPress = () => {
    handleAdvancedSubmit()
  }

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const renderDocumentSelector = (
    type: 'resume' | 'coverLetter',
    selected: (typeof RESUMES)[number],
    options: typeof RESUMES,
    onSelect: (item: (typeof RESUMES)[number]) => void
  ) => {
    const isOpen = activeDropdown === type
    return (
      <View style={styles.applySectionCard}>
        <Text style={styles.applyLabel}>{type === 'resume' ? 'Resume' : 'Cover Letter'}</Text>

        {!isOpen ? (
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', columnGap: 12 }}
              onPress={() => setActiveDropdown(type)}
              activeOpacity={0.85}
            >
              <View style={styles.iconCircle}>
                <Feather name={type === 'resume' ? 'file-text' : 'file'} size={16} color='#fff' />
              </View>
              <View>
                <Text style={styles.selectorTitle}>{selected.title}</Text>
                <Text style={styles.selectorSub}>{selected.subtitle}</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              <TouchableOpacity onPress={() => setPreviewDoc(selected)} style={{ padding: 4 }} activeOpacity={0.85}>
                <Feather name='eye' size={18} color={CLTheme.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveDropdown(type)} style={{ padding: 4 }} activeOpacity={0.85}>
                <Feather name='chevron-down' size={18} color={CLTheme.text.muted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.dropdownContainer}>
            {options.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.dropdownOption, item.id === selected.id && styles.dropdownOptionSelected]}
                onPress={() => {
                  onSelect(item)
                  setActiveDropdown(null)
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
                  <View style={[styles.iconCircle, item.id !== selected.id && styles.iconCircleMuted]}>
                    <Feather name={type === 'resume' ? 'file-text' : 'file'} size={16} color='#fff' />
                  </View>
                  <View>
                    <Text style={styles.selectorTitle}>{item.title}</Text>
                    <Text style={styles.selectorSub}>{item.subtitle}</Text>
                  </View>
                </View>
                {item.id === selected.id ? <Feather name='check' size={18} color={CLTheme.accent} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialIcons name='arrow-back' size={22} color={CLTheme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.85} onPress={() => toggleSaveJob(job)}>
          <MaterialIcons
            name={isSaved ? 'bookmark' : 'bookmark-border'}
            size={20}
            color={isSaved ? CLTheme.accent : CLTheme.text.secondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#1f4e97', '#0d6cf2', '#0b8bd9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.logoWrap}>
              {job.logo ? (
                <Image source={{ uri: job.logo }} style={styles.logoImage} resizeMode='cover' />
              ) : (
                <Text style={styles.logoFallback}>{job.company.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.matchPill}>
              <Text style={styles.matchValue}>{job.match ?? '--'}</Text>
              <Text style={styles.matchLabel}>Match</Text>
            </View>
          </View>

          <Text style={styles.heroRole}>{job.role}</Text>
          <Text style={styles.heroCompany}>
            {job.company}  {job.location}
          </Text>

          <View style={styles.heroChips}>
            {job.tags?.map(tag => (
              <View key={tag} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job Description</Text>
          <Text style={styles.cardBody}>{research.whyThisRole}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What You Will Do</Text>
          {renderBulletItems(research.responsibilities)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Qualifications</Text>
          {renderBulletItems(research.mustHaves)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About {job.company}</Text>
          <Text style={styles.cardBody}>{research.about}</Text>
          <View style={styles.factList}>{renderBulletItems(research.companyFacts)}</View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Company Research Snapshot</Text>
          {renderBulletItems(research.researchSignals)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Interview Prep Focus</Text>
          {renderBulletItems(research.interviewFocus)}
        </View>
      </ScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={[styles.secondaryButton, isSaved && styles.secondaryButtonSaved]}
          activeOpacity={0.85}
          onPress={() => toggleSaveJob(job)}
        >
          <Text style={[styles.secondaryButtonText, isSaved && styles.secondaryButtonTextSaved]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88} onPress={() => setApplyDrawerVisible(true)}>
          <Text style={styles.primaryButtonText}>Submit Application</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={applyDrawerVisible}
        animationType='slide'
        transparent
        onRequestClose={closeApplyDrawer}
      >
        <Pressable style={styles.drawerOverlay} onPress={closeApplyDrawer}>
          <Pressable style={styles.drawerContent} onPress={event => event.stopPropagation()}>
            <View style={styles.drawerHandle} />

            {/* Drawer title */}
            <View style={styles.drawerTitleRow}>
              <Text style={styles.drawerTitle}>Prepare Application</Text>
              <TouchableOpacity onPress={closeApplyDrawer} style={styles.drawerCloseBtn}>
                <MaterialIcons name='close' size={20} color={CLTheme.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.drawerTabBar}>
              <TouchableOpacity
                style={[styles.drawerTab, applyTab === 'simple' && styles.drawerTabActive]}
                onPress={() => setApplyTab('simple')}
                activeOpacity={0.8}
              >
                <Text style={[styles.drawerTabText, applyTab === 'simple' && styles.drawerTabTextActive]}>Simple</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drawerTab, applyTab === 'advanced' && styles.drawerTabActive]}
                onPress={() => setApplyTab('advanced')}
                activeOpacity={0.8}
              >
                <Text style={[styles.drawerTabText, applyTab === 'advanced' && styles.drawerTabTextActive]}>Advanced</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScrollContent}>
              {applyTab === 'simple' ? (
                <>
                  <Text style={styles.applySubheader}>
                    Select your resume and cover letter, then hold to apply with AI.
                  </Text>

                  {renderDocumentSelector('resume', selectedResume, RESUMES, setSelectedResume)}
                  {renderDocumentSelector('coverLetter', selectedCoverLetter, COVER_LETTERS, setSelectedCoverLetter)}

                  <View style={styles.applyActionSection}>
                    <View style={styles.creditCostRow}>
                      <View style={styles.creditLeftRow}>
                        <Feather name='zap' size={14} color={creditColor} />
                        <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
                      </View>
                      <Text style={styles.creditEstimate}>Est. cost: ~{applyCost} credits</Text>
                    </View>
                  </View>
                </>
              ) : (
                /* Advanced Tab: Apply Pack Review */
                <View style={styles.advancedTabContainer}>
                  {/* Job Context Card */}
                  <View style={styles.advJobCard}>
                    <View style={styles.advLogoBox}>
                      {job.logo ? (
                        <Image source={{ uri: job.logo }} style={styles.advLogoImage} resizeMode='contain' />
                      ) : (
                        <Text style={styles.advLogoFallback}>{job.company.charAt(0)}</Text>
                      )}
                    </View>
                    <View style={styles.advJobInfo}>
                      <View style={styles.advJobHeaderRow}>
                        <Text style={styles.advJobTitle} numberOfLines={1}>{job.role}</Text>
                        <View style={styles.advMatchBadge}>
                          <Text style={styles.advMatchText}>{job.match ?? '--'} Match</Text>
                        </View>
                      </View>
                      <Text style={styles.advCompanyLoc}>{job.company} • {job.location}</Text>
                      <View style={styles.advTagsRow}>
                        {job.tags?.slice(0, 2).map(tag => (
                          <View key={tag} style={styles.advTag}>
                            <Text style={styles.advTagText}>{tag.toUpperCase()}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Resume Preview */}
                  <View style={styles.advSectionHeader}>
                    <Text style={styles.advSectionTitle}>TAILORED RESUME</Text>
                    <View style={styles.advVariantBadge}>
                      <Text style={styles.advVariantText}>Variant 1</Text>
                    </View>
                  </View>
                  <View style={styles.advCard}>
                    <View style={styles.advResumeContent}>
                      <View style={styles.advPdfThumb}>
                        <View style={styles.advPdfLine1} />
                        <View style={styles.advPdfLine2} />
                        <View style={styles.advPdfLines}>
                          {[0,1,2,3,4].map(i => (
                            <View key={i} style={[styles.advPdfLine, i === 2 && { width: '75%' }]} />
                          ))}
                        </View>
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)']} style={StyleSheet.absoluteFill} />
                      </View>
                      <View style={styles.advResumeInfo}>
                        <View>
                          <Text style={styles.advResumeFilename}>{selectedResume.title}</Text>
                          <Text style={styles.advResumeMeta}>1 Page • PDF</Text>
                          <Text style={styles.advResumeDate}>{selectedResume.subtitle}</Text>
                        </View>
                        <View style={styles.advResumeActions}>
                          <TouchableOpacity style={styles.advPreviewBtn} onPress={() => setPreviewDoc(selectedResume)}>
                            <MaterialIcons name='visibility' size={15} color='#e2e8f0' />
                            <Text style={styles.advPreviewBtnText}>Preview</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Cover Note */}
                  <View style={styles.advSectionHeader}>
                    <Text style={styles.advSectionTitle}>COVER NOTE</Text>
                    <TouchableOpacity style={styles.advEditLink}>
                      <MaterialIcons name='edit' size={13} color='#0d6cf2' />
                      <Text style={styles.advEditLinkText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.advCoverCard}>
                    <Text style={styles.advCoverSalutation}>Dear Hiring Team,</Text>
                    <Text style={styles.advCoverBody}>{selectedCoverLetter.content}</Text>
                    <LinearGradient
                      colors={['transparent', CLTheme.background]}
                      style={styles.advCoverOverlay}
                    >
                      <TouchableOpacity style={styles.advReadFullBtn} onPress={() => setPreviewDoc(selectedCoverLetter)}>
                        <Text style={styles.advReadFullText}>Read Full Note</Text>
                        <MaterialIcons name='expand-more' size={15} color='#fff' />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Suggested Answers */}
                  <View style={styles.advSectionHeader}>
                    <Text style={styles.advSectionTitle}>SUGGESTED ANSWERS</Text>
                  </View>
                  {[
                    { q: 'Why do you want to work here?', a: `I've always admired ${job.company}'s work. My background aligns strongly with this role's requirements and I'm excited to contribute.` },
                    { q: 'Salary Expectations?', a: job.tags?.find(t => t.includes('$')) ?? 'Negotiable based on total compensation package', isMono: true },
                    { q: 'Notice Period?', a: 'I am available to start within 2 weeks of receiving an offer.' },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.advAnswerCard}>
                      <View style={styles.advAnswerHeader}>
                        <Text style={styles.advQuestionText}>{item.q}</Text>
                        <TouchableOpacity onPress={() => handleCopyAnswer(item.a)}>
                          <MaterialIcons name='content-copy' size={17} color={CLTheme.text.muted} />
                        </TouchableOpacity>
                      </View>
                      {item.isMono ? (
                        <View style={styles.advMonoWrap}>
                          <Text style={styles.advMonoText}>{item.a}</Text>
                        </View>
                      ) : (
                        <Text style={styles.advAnswerText}>{item.a}</Text>
                      )}
                    </View>
                  ))}

                  {/* Credits row */}
                  <View style={styles.creditCostRow}>
                    <View style={styles.creditLeftRow}>
                      <Feather name='zap' size={14} color={creditColor} />
                      <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
                    </View>
                    <Text style={styles.creditEstimate}>No AI credit charge for advanced submit</Text>
                  </View>

                  <View style={styles.advFooterHint}>
                    <MaterialIcons name='info-outline' size={13} color='#f59e0b' />
                    <Text style={styles.advFooterHintText}>Remember to attach the PDF manually!</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.cancelApplyButton} onPress={closeApplyDrawer} activeOpacity={0.85}>
                <Text style={styles.cancelApplyText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Sticky CTA always visible */}
            <View style={styles.drawerFooter}>
              <Text style={styles.applyHoldLabel}>
                {applyTab === 'advanced' ? 'Click to Approve' : 'Hold to Apply with AI'}
              </Text>
              <Pressable
                onPressIn={applyTab === 'simple' && canAffordApply ? handleHoldStart : undefined}
                onPressOut={applyTab === 'simple' ? handleHoldEnd : undefined}
                onPress={applyTab === 'advanced' ? handleAdvancedPress : undefined}
                style={[styles.holdBtnContainer, applyTab === 'simple' && !canAffordApply && { opacity: 0.4 }]}
              >
                <Animated.View style={[styles.holdFill, { width: fillWidth }]} />
                <View style={styles.holdContent}>
                  <Feather name='send' size={18} color='#fff' style={{ marginRight: 8 }} />
                  <Text style={styles.holdText}>Applying...</Text>
                </View>
                <View style={styles.holdLabelOverlay}>
                  <Text style={styles.holdText}>{applyTab === 'advanced' ? 'Approve & Log Submission' : 'Hold to Apply'}</Text>
                </View>
              </Pressable>
              {applyTab === 'simple' && !canAffordApply ? <Text style={styles.creditWarning}>Not enough credits</Text> : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!previewDoc} animationType='fade' transparent onRequestClose={() => setPreviewDoc(null)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{previewDoc?.title}</Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.previewCloseBtn} activeOpacity={0.85}>
                <Feather name='x' size={22} color={CLTheme.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.previewBody}>{previewDoc?.content}</Text>
            </ScrollView>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    backgroundColor: CLTheme.background,
  },
  headerTitle: {
    color: CLTheme.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  content: {
    padding: 16,
    rowGap: 12,
    paddingBottom: 120,
  },
  hero: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    color: CLTheme.text.primary,
    fontWeight: '800',
    fontSize: 20,
  },
  matchPill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  matchLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  heroRole: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroCompany: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 6,
  },
  heroChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroChipText: {
    color: CLTheme.text.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    padding: 14,
  },
  cardTitle: {
    color: CLTheme.text.primary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
  },
  cardBody: {
    color: CLTheme.text.secondary,
    fontSize: 14,
    lineHeight: 21,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: CLTheme.accent,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    color: CLTheme.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  factList: {
    marginTop: 10,
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: 'rgba(16,23,34,0.97)',
    flexDirection: 'row',
    columnGap: 10,
  },
  secondaryButton: {
    width: 90,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#2d3f56',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CLTheme.card,
  },
  secondaryButtonSaved: {
    borderColor: 'rgba(13,108,242,0.65)',
    backgroundColor: 'rgba(13,108,242,0.16)',
  },
  secondaryButtonText: {
    color: CLTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonTextSaved: {
    color: CLTheme.accent,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CLTheme.accent,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    maxHeight: '85%',
    backgroundColor: CLTheme.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  drawerHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: CLTheme.border,
    marginTop: 12,
    marginBottom: 10,
  },
  drawerScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CLTheme.text.primary,
    letterSpacing: 0.1,
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerTabBar: {
    flexDirection: 'row',
    backgroundColor: CLTheme.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 3,
  },
  drawerTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  drawerTabActive: {
    backgroundColor: '#0d6cf2',
  },
  drawerTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.muted,
  },
  drawerTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  // Advanced tab styles
  advancedTabContainer: {
    gap: 16,
  },
  advJobCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    flexDirection: 'row',
    gap: 14,
  },
  advLogoBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  advLogoImage: {
    width: '100%',
    height: '100%',
  },
  advLogoFallback: {
    color: '#0d6cf2',
    fontWeight: '800',
    fontSize: 20,
  },
  advJobInfo: {
    flex: 1,
  },
  advJobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  advJobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 8,
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
    color: CLTheme.text.secondary,
    fontWeight: '500',
  },
  advTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  advTag: {
    backgroundColor: '#232d3d',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  advTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  advSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: CLTheme.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  advVariantBadge: {
    backgroundColor: 'rgba(13,108,242,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  advVariantText: {
    color: '#0d6cf2',
    fontSize: 11,
    fontWeight: '500',
  },
  advCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  advResumeContent: {
    flexDirection: 'row',
    gap: 14,
  },
  advPdfThumb: {
    width: 72,
    height: 100,
    backgroundColor: '#232d3d',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
  },
  advPdfLine1: {
    position: 'absolute',
    top: 8,
    left: 6,
    right: 6,
    height: 7,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  advPdfLine2: {
    position: 'absolute',
    top: 22,
    left: 6,
    width: '50%',
    height: 3,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  advPdfLines: {
    position: 'absolute',
    top: 34,
    left: 6,
    right: 6,
    gap: 5,
  },
  advPdfLine: {
    height: 2,
    backgroundColor: CLTheme.text.muted,
    width: '100%',
  },
  advResumeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  advResumeFilename: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 13,
  },
  advResumeMeta: {
    fontSize: 11,
    color: CLTheme.text.secondary,
    marginTop: 3,
  },
  advResumeDate: {
    fontSize: 11,
    color: CLTheme.text.muted,
    marginTop: 2,
  },
  advResumeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  advPreviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#232d3d',
    paddingVertical: 7,
    borderRadius: 8,
  },
  advPreviewBtnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  advEditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  advEditLinkText: {
    color: '#0d6cf2',
    fontSize: 12,
    fontWeight: '500',
  },
  advCoverCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  advCoverSalutation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  advCoverBody: {
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
    marginBottom: 40,
  },
  advCoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  advReadFullBtn: {
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    elevation: 3,
  },
  advReadFullText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  advAnswerCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  advAnswerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  advQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
    flex: 1,
    marginRight: 8,
  },
  advAnswerText: {
    fontSize: 13,
    lineHeight: 19,
    color: CLTheme.text.secondary,
  },
  advMonoWrap: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  advMonoText: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    fontFamily: 'monospace',
  },
  advFooterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  advFooterHintText: {
    fontSize: 12,
    color: CLTheme.text.secondary,
  },
  applyHeader: {
    color: CLTheme.text.primary,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  applySubheader: {
    color: CLTheme.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 19,
  },
  applySectionCard: {
    marginBottom: 12,
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    padding: 12,
  },
  applyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleMuted: {
    backgroundColor: CLTheme.border,
  },
  dropdownContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 58,
    paddingHorizontal: 10,
    backgroundColor: CLTheme.background,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: CLTheme.card,
  },
  applyActionSection: {
    marginTop: 18,
  },
  creditCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  creditLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
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
  applyHoldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  holdLabelOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditWarning: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 10,
  },
  cancelApplyButton: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelApplyText: {
    color: CLTheme.text.muted,
    fontSize: 14,
  },
  previewModalContent: {
    marginHorizontal: 16,
    marginVertical: 48,
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    overflow: 'hidden',
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
  },
  previewTitle: {
    color: CLTheme.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  previewCloseBtn: {
    padding: 4,
  },
  previewBody: {
    color: CLTheme.text.primary,
    fontSize: 15,
    lineHeight: 22,
  },
})
