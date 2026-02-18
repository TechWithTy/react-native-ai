import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Modal,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from './theme'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useCreditsStore, CREDIT_COSTS } from '../../store/creditsStore'
import { SubscriptionModal } from './subscriptionModal'
import { useUserProfileStore } from '../../store/userProfileStore'
import { CustomInterviewPrepPayload } from '../../../types'

const { width } = Dimensions.get('window')

const CUSTOM_FLOW_STEPS = [
  'Role Snapshot',
  'Focus Areas',
  'Question Drill',
] as const

export function InterviewPrepScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const [showStoryBank, setShowStoryBank] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [selectedStory, setSelectedStory] = useState<any>(null)
  const [showRubric, setShowRubric] = useState(false)
  const [showResearch, setShowResearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)
  const [customFlowStep, setCustomFlowStep] = useState(0)
  const [customPrepSaved, setCustomPrepSaved] = useState(false)

  const { balance, canAfford } = useCreditsStore()
  const { saveCustomInterviewPrep } = useUserProfileStore()
  const interviewCost = CREDIT_COSTS.mockInterview
  const hasEnoughCredits = canAfford('mockInterview')
  const customPrep = (route as any)?.params?.customPrep as CustomInterviewPrepPayload | undefined
  const isCustomFlow = Boolean(customPrep)

  const generatedQuestions = customPrep?.focusAreas.map(
    area => `Tell me about a time you showed strong ${area.toLowerCase()}.`
  ) ?? []

  useEffect(() => {
    setCustomFlowStep(0)
    setCustomPrepSaved(false)
  }, [customPrep?.generatedAt])

  const readinessScore = isCustomFlow
    ? Math.min(90, 58 + (customPrep?.focusAreas.length || 0) * 8)
    : 65

  // Navigation Logic
  const handleStartMock = () => {
    if (isCustomFlow && customPrep) {
      const openingQuestion = generatedQuestions[0] ||
        `Why are you a strong fit for this ${customPrep.inferredRole} role?`

      ;(navigation as any).navigate('MockInterview', {
        question: openingQuestion,
        category: customPrep.inferredRole,
      })
      return
    }

    ;(navigation as any).navigate('MockInterview')
  }

  const handleAdvanceCustomFlow = () => {
    if (!customPrep) return

    if (customFlowStep < CUSTOM_FLOW_STEPS.length - 1) {
      setCustomFlowStep(step => step + 1)
      return
    }

    if (customPrepSaved) return
    saveCustomInterviewPrep(customPrep)
    setCustomPrepSaved(true)
    Alert.alert(
      'Saved To Profile',
      `Custom interview prep for "${customPrep.inferredRole}" is now attached to your profile.`
    )
  }

  // Render Main Dashboard
  if (!showStoryBank && !showQuestions && !showRubric && !showResearch) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            >
            <Feather name="arrow-left" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                  {isCustomFlow ? 'Custom Interview Prep' : 'Interview Prep'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isCustomFlow ? customPrep?.inferredRole || 'Custom Role' : 'Senior Product Manager'}
                </Text>
            </View>
            <TouchableOpacity 
                style={styles.menuButton} 
                onPress={() => setShowMenu(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Feather name="more-horizontal" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Value Proposition / Readiness */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroCard}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroLabel}>READINESS SCORE</Text>
                    <Text style={styles.heroValue}>{readinessScore}%</Text>
                    <Text style={styles.heroText}>
                      {isCustomFlow
                        ? `Built for ${customPrep?.companyName || 'your target company'} and your inferred role.`
                        : 'You are on track for your interview in 3 days.'}
                    </Text>
                </View>
                <View style={styles.heroGraph}>
                     {/* Placeholder for circular graph visual */}
                    <View style={styles.graphCircle}>
                        <Feather name="trending-up" size={24} color={CLTheme.accent} />
                    </View>
                </View>
            </Animated.View>

            {/* Credits Bar */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <View style={styles.creditsBar}>
                    <View style={styles.creditsLeft}>
                        <Feather name="zap" size={16} color={balance > 30 ? '#10b981' : balance > 10 ? '#f59e0b' : '#ef4444'} />
                        <Text style={styles.creditsBalanceText}>
                            <Text style={{fontWeight: '700', color: balance > 30 ? '#10b981' : balance > 10 ? '#f59e0b' : '#ef4444'}}>
                                {balance}
                            </Text>
                            {' '}credits available
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.buyCreditsBtn} onPress={() => setShowSubscription(true)}>
                        <Text style={styles.buyCreditsText}>Get More</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Primary Action */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <TouchableOpacity
                    style={[styles.primaryActionBtn, !hasEnoughCredits && styles.primaryActionBtnDisabled]}
                    onPress={handleStartMock}
                    disabled={!hasEnoughCredits}
                >
                    <View style={styles.actionIconBox}>
                        <MaterialIcons name="mic" size={28} color="#fff" />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.actionTitle}>
                          {isCustomFlow ? 'Start Custom Mock Interview' : 'Start Mock Interview'}
                        </Text>
                        <Text style={styles.actionSubtitle}>
                          {isCustomFlow
                            ? 'Practice with questions generated from this job description'
                            : 'Simulate a 30-min behavioral session'}
                        </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        <Feather name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.costLabel}>~{interviewCost} credits</Text>
                    </View>
                </TouchableOpacity>
                {!hasEnoughCredits && (
                    <Text style={styles.insufficientText}>Insufficient credits for this action</Text>
                )}
            </Animated.View>

            {isCustomFlow && customPrep && (
                <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.customFlowCard}>
                    <View style={styles.customFlowHeader}>
                        <Text style={styles.customFlowTitle}>Custom Prep Flow</Text>
                        <View style={[styles.customFlowBadge, customPrepSaved && styles.customFlowBadgeSaved]}>
                            <Text style={styles.customFlowBadgeText}>
                              {customPrepSaved ? 'Saved' : `Step ${customFlowStep + 1}/${CUSTOM_FLOW_STEPS.length}`}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.customFlowSubtitle}>
                      {customPrep.companyName
                        ? `${customPrep.inferredRole} at ${customPrep.companyName}`
                        : `${customPrep.inferredRole} role focus`}
                    </Text>

                    <View style={styles.customStepRow}>
                      {CUSTOM_FLOW_STEPS.map((step, index) => {
                        const done = index < customFlowStep || customPrepSaved
                        const active = index === customFlowStep && !customPrepSaved
                        return (
                          <View key={step} style={styles.customStepItem}>
                            <MaterialIcons
                              name={done ? 'check-circle' : active ? 'pending' : 'radio-button-unchecked'}
                              size={16}
                              color={done ? '#10b981' : active ? CLTheme.accent : CLTheme.text.muted}
                            />
                            <Text
                              style={[
                                styles.customStepText,
                                active && styles.customStepTextActive,
                                done && styles.customStepTextDone,
                              ]}
                            >
                              {step}
                            </Text>
                          </View>
                        )
                      })}
                    </View>

                    <View style={styles.customFocusWrap}>
                      {customPrep.focusAreas.map(area => (
                        <View key={area} style={styles.customFocusChip}>
                          <Text style={styles.customFocusText}>{area}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.customQuestionLabel}>Generated opener</Text>
                    <Text style={styles.customQuestionText}>
                      {generatedQuestions[0] || `Walk me through why you're a fit for ${customPrep.inferredRole}.`}
                    </Text>

                    <TouchableOpacity
                      style={[styles.customFlowButton, customPrepSaved && styles.customFlowButtonSaved]}
                      onPress={handleAdvanceCustomFlow}
                      disabled={customPrepSaved}
                    >
                      <Text style={styles.customFlowButtonText}>
                        {customPrepSaved
                          ? 'Saved To Profile'
                          : customFlowStep < CUSTOM_FLOW_STEPS.length - 1
                            ? 'Continue Custom Prep'
                            : 'Finish & Save To Profile'}
                      </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            <Text style={styles.sectionHeader}>
              {isCustomFlow ? 'Base Preparation Tools' : 'Preparation Tools'}
            </Text>

            <View style={styles.gridContainer}>
                {/* Story Bank Button */}
                <TouchableOpacity style={styles.gridCard} onPress={() => setShowStoryBank(true)}>
                    <View style={[styles.gridIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <Feather name="book-open" size={24} color="#10b981" />
                    </View>
                    <Text style={styles.gridTitle}>Story Bank</Text>
                    <Text style={styles.gridSubtitle}>Review your STAR stories</Text>
                </TouchableOpacity>

                {/* Practice Questions Button */}
                <TouchableOpacity style={styles.gridCard} onPress={() => setShowQuestions(true)}>
                    <View style={[styles.gridIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                        <Feather name="help-circle" size={24} color="#f59e0b" />
                    </View>
                    <Text style={styles.gridTitle}>Questions</Text>
                    <Text style={styles.gridSubtitle}>Top 50 behavioral Qs</Text>
                </TouchableOpacity>

                {/* Rubric Review */}
                 <TouchableOpacity style={styles.gridCard} onPress={() => setShowRubric(true)}>
                    <View style={[styles.gridIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <Feather name="check-square" size={24} color="#6366f1" />
                    </View>
                    <Text style={styles.gridTitle}>Rubric</Text>
                    <Text style={styles.gridSubtitle}>Evaluation criteria</Text>
                </TouchableOpacity>

                {/* Company Research */}
                <TouchableOpacity style={styles.gridCard} onPress={() => setShowResearch(true)}>
                    <View style={[styles.gridIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                        <Feather name="search" size={24} color="#ec4899" />
                    </View>
                    <Text style={styles.gridTitle}>Research</Text>
                    <Text style={styles.gridSubtitle}>Spotify details</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
        
        {/* Quick Menu Modal (Dashboard) */}
        <Modal visible={showMenu} animationType="slide" transparent>
            <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
            >
                <View style={styles.menuContainer}>
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Dashboard Options</Text>
                    <TouchableOpacity onPress={() => setShowMenu(false)}>
                        <Feather name="x" size={24} color={CLTheme.text.secondary} />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); alert('Edit Target Role') }}>
                    <Feather name="edit" size={20} color={CLTheme.text.secondary} />
                    <Text style={styles.menuOptionText}>Edit Target Role</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); alert('Notification Settings') }}>
                    <Feather name="settings" size={20} color={CLTheme.text.secondary} />
                    <Text style={styles.menuOptionText}>Notification Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); alert('Help & Support') }}>
                    <Feather name="help-circle" size={20} color={CLTheme.text.secondary} />
                    <Text style={styles.menuOptionText}>Help & Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 0, marginTop: 12 }]} onPress={() => { setShowMenu(false); alert('Reset Progress') }}>
                    <Feather name="refresh-cw" size={20} color="#ef4444" />
                    <Text style={[styles.menuOptionText, styles.menuOptionDestructive]}>Reset Progress</Text>
                </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>

        {/* Subscription / Get More Credits Modal */}
        <SubscriptionModal
          visible={showSubscription}
          onClose={() => setShowSubscription(false)}
          currentBalance={balance}
        />
      </SafeAreaView>
    )
  }

  // Render Sub-Screens based on state
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => {
                    setShowStoryBank(false)
                    setShowQuestions(false)
                    setShowRubric(false)
                    setShowResearch(false)
                }}
            >
                <Feather name="arrow-left" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                    {showStoryBank ? 'Story Bank' : showQuestions ? 'Practice Questions' : showRubric ? 'Evaluation Rubric' : 'Company Research'}
                </Text>
            </View>
            <TouchableOpacity 
                style={styles.menuButton} 
                onPress={() => setShowMenu(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Feather name="more-horizontal" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            {showStoryBank && <StoriesSection onStoryPress={setSelectedStory} />}
            {showQuestions && <QuestionsSection />}
            {showRubric && <RubricSection />}
            {showResearch && <ResearchSection />}
        </ScrollView>

         {/* Story Detail Modal */}
      <Modal visible={!!selectedStory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedStory?.title}</Text>
                    <TouchableOpacity onPress={() => setSelectedStory(null)} style={styles.closeBtn}>
                        <Feather name="x" size={24} color={CLTheme.text.primary} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding: 20}}>
                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Situation</Text>
                        <Text style={styles.modalText}>Context about the {selectedStory?.title}...</Text>
                    </View>
                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Task</Text>
                        <Text style={styles.modalText}>What was your specific responsibility...</Text>
                    </View>
                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Action</Text>
                        <Text style={styles.modalText}>The steps you took to resolve...</Text>
                    </View>
                    <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Result</Text>
                        <Text style={styles.modalText}>The positive business outcome...</Text>
                    </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        style={styles.modalCta}
                        onPress={() => {
                            setSelectedStory(null);
                            (navigation as any).navigate('MockInterview', { 
                                question: `Tell me about the ${selectedStory?.title} situation.`,
                                category: selectedStory?.tag
                            })
                        }}
                    >
                        <Text style={styles.modalCtaText}>Practice This Story</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Quick Menu Modal */}
      <Modal visible={showMenu} animationType="slide" transparent>
        <TouchableOpacity 
           style={styles.menuOverlay}
           activeOpacity={1}
           onPress={() => setShowMenu(false)}
        >
            <View style={styles.menuContainer}>
               <View style={styles.menuHeader}>
                   <Text style={styles.menuTitle}>Dashboard Options</Text>
                   <TouchableOpacity onPress={() => setShowMenu(false)}>
                       <Feather name="x" size={24} color={CLTheme.text.secondary} />
                   </TouchableOpacity>
               </View>
               
               <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); alert('Edit Role') }}>
                   <Feather name="edit" size={20} color={CLTheme.text.secondary} />
                   <Text style={styles.menuOptionText}>Edit Target Role</Text>
               </TouchableOpacity>
               
               <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); alert('Settings') }}>
                   <Feather name="settings" size={20} color={CLTheme.text.secondary} />
                   <Text style={styles.menuOptionText}>Notification Settings</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); alert('Help') }}>
                   <Feather name="help-circle" size={20} color={CLTheme.text.secondary} />
                   <Text style={styles.menuOptionText}>Help & Support</Text>
               </TouchableOpacity>

               <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 0, marginTop: 12 }]} onPress={() => { setShowMenu(false); alert('Reset') }}>
                   <Feather name="refresh-cw" size={20} color="#ef4444" />
                   <Text style={[styles.menuOptionText, styles.menuOptionDestructive]}>Reset Progress</Text>
               </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  )
}

function StoriesSection({ onStoryPress }: { onStoryPress: (story: any) => void }) {
    const stories = [
        { id: 1, title: 'The API Migration', tag: 'Leadership', status: 'Ready', color: '#10b981' },
        { id: 2, title: 'Q4 Budget Conflict', tag: 'Conflict', status: 'Needs Work', color: '#f59e0b' },
        { id: 3, title: 'Market Entry 2024', tag: 'Strategy', status: 'Drafting', color: '#64748b' },
        { id: 4, title: 'Team Restructuring', tag: 'Management', status: 'Ready', color: '#10b981' },
    ]

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.sectionContainer}>
            {stories.map((story, index) => (
                <TouchableOpacity 
                    key={story.id} 
                    style={styles.storyCard}
                    onPress={() => onStoryPress(story)}
                >
                    <View style={[styles.storyColorStrip, { backgroundColor: story.color }]} />
                    <View style={styles.storyContent}>
                        <View style={styles.storyHeader}>
                            <Text style={styles.storyTitle}>{story.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: `${story.color}20` }]}>
                                <Text style={[styles.statusText, { color: story.color }]}>{story.status}</Text>
                            </View>
                        </View>
                        <View style={styles.storyFooter}>
                            <View style={styles.tagBadge}>
                                <Feather name="tag" size={12} color={CLTheme.text.secondary} />
                                <Text style={styles.tagText}>{story.tag}</Text>
                            </View>
                            <Feather name="edit-2" size={14} color={CLTheme.text.muted} />
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </Animated.View>
    )
}

function QuestionsSection() {
    const navigation = useNavigation()
    const questions = [
        { id: 1, text: 'Tell me about a time you failed to meet a deadline.', category: 'Reliability' },
        { id: 2, text: 'How do you handle influence without authority?', category: 'Leadership' },
        { id: 3, text: 'Improve Google Maps for visually impaired users.', category: 'Product Sense' },
        { id: 4, text: 'Describe a conflict with an engineer.', category: 'Cross-functional' },
    ]

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.sectionContainer}>
            {questions.map((q, i) => (
                <TouchableOpacity 
                    key={q.id} 
                    style={styles.questionCard}
                    onPress={() => (navigation as any).navigate('MockInterview', { question: q.text, category: q.category })}
                >
                    <View style={styles.questionMain}>
                        <View style={styles.qIcon}>
                            <Text style={styles.qIndex}>{i + 1}</Text>
                        </View>
                        <View style={styles.qContent}>
                            <Text style={styles.qText}>{q.text}</Text>
                            <Text style={styles.qCategory}>{q.category}</Text>
                        </View>
                    </View>
                    <View style={styles.practiceBtnSmall}>
                        <Text style={styles.practiceBtnText}>Practice</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </Animated.View>
    )
}

function RubricSection() {
    const criteria = [
        { title: 'Product Sense', desc: 'Can you verify if a problem is worth solving?', weight: '30%' },
        { title: 'Analytical & Technical', desc: 'Can you rely on data to make decisions?', weight: '25%' },
        { title: 'Communication', desc: 'Are you structured, clear/concise, and influential?', weight: '25%' },
        { title: 'Leadership & Strategy', desc: 'Can you define a vision and rally a team?', weight: '20%' },
    ]

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.sectionContainer}>
             <View style={styles.infoCard}>
                <Feather name="info" size={20} color={CLTheme.accent} style={{marginBottom: 8}} />
                <Text style={styles.infoText}>This rubric is based on standard Senior PM interviews at Big Tech companies.</Text>
            </View>

            {criteria.map((item, index) => (
                <View key={index} style={styles.rubricCard}>
                    <View style={styles.rubricHeader}>
                        <Text style={styles.rubricTitle}>{item.title}</Text>
                        <View style={styles.weightBadge}>
                            <Text style={styles.weightText}>{item.weight}</Text>
                        </View>
                    </View>
                    <Text style={styles.rubricDesc}>{item.desc}</Text>
                    
                    <View style={{flexDirection: 'row', gap: 4, marginTop: 12}}>
                        {[1,2,3,4,5].map(star => (
                            <Feather key={star} name="star" size={16} color={CLTheme.text.muted} />
                        ))}
                    </View>
                </View>
            ))}
        </Animated.View>
    )
}

function ResearchSection() {
    return (
         <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.sectionContainer}>
            <View style={styles.companyHeader}>
                <View style={[styles.logoBoxLarge, {backgroundColor: '#1db954'}]}>
                   <Text style={{fontSize: 24, fontWeight: '700', color: '#fff'}}>S</Text>
                </View>
                <View>
                    <Text style={styles.companyName}>Spotify</Text>
                    <Text style={styles.companyTicker}>NYSE: SPOT</Text>
                </View>
            </View>

            <View style={styles.researchSection}>
                <Text style={styles.researchTitle}>Mission</Text>
                <Text style={styles.researchText}>To unlock the potential of human creativity—by giving a million creative artists the opportunity to live off their art and billions of fans the opportunity to enjoy and be inspired by it.</Text>
            </View>

             <View style={styles.researchSection}>
                <Text style={styles.researchTitle}>Core Values</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                    {['Innovative', 'Collaborative', 'Sincere', 'Passion', 'Playful'].map(val => (
                        <View key={val} style={styles.valueChip}>
                            <Text style={styles.valueText}>{val}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.researchSection}>
                <Text style={styles.researchTitle}>Recent News</Text>
                <View style={styles.newsCard}>
                    <Text style={styles.newsHeadline}>Spotify Launches New AI DJ Feature</Text>
                    <Text style={styles.newsDate}>2 days ago • TechCrunch</Text>
                </View>
                <View style={styles.newsCard}>
                    <Text style={styles.newsHeadline}>Q4 Earnings Report: User Growth Exceeds Expectations</Text>
                    <Text style={styles.newsDate}>1 week ago • Reuters</Text>
                </View>
            </View>
         </Animated.View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    zIndex: 100,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: CLTheme.card,
  },
  menuButton: {
    padding: 8,
  },
  headerContent: {
      alignItems: 'center',
  },
  headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  headerSubtitle: {
      fontSize: 12,
      color: CLTheme.text.secondary,
      marginTop: 2,
  },
  scrollContent: {
      padding: 20,
      paddingBottom: 40,
  },
  heroCard: {
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  heroContent: {
      flex: 1,
      paddingRight: 16,
  },
  heroLabel: {
      fontSize: 11,
      color: CLTheme.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
  },
  heroValue: {
      fontSize: 32,
      fontWeight: '800',
      color: CLTheme.text.primary,
      marginBottom: 4,
  },
  heroText: {
      fontSize: 13,
      color: CLTheme.text.secondary,
      lineHeight: 18,
  },
  heroGraph: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  graphCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(13, 108, 242, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: CLTheme.accent,
  },
  primaryActionBtn: {
      backgroundColor: CLTheme.accent,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
      shadowColor: CLTheme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
  },
  actionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  actionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
  },
  actionSubtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
  },
  sectionHeader: {
      fontSize: 18,
      fontWeight: '700',
      color: CLTheme.text.primary,
      marginBottom: 16,
  },
  customFlowCard: {
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
      padding: 16,
      marginBottom: 20,
  },
  customFlowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
  },
  customFlowTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  customFlowBadge: {
      backgroundColor: 'rgba(13, 108, 242, 0.15)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
  },
  customFlowBadgeSaved: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  customFlowBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: CLTheme.accent,
  },
  customFlowSubtitle: {
      fontSize: 13,
      color: CLTheme.text.secondary,
      marginBottom: 12,
  },
  customStepRow: {
      gap: 8,
      marginBottom: 12,
  },
  customStepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  customStepText: {
      fontSize: 12,
      color: CLTheme.text.muted,
  },
  customStepTextActive: {
      color: CLTheme.accent,
      fontWeight: '600',
  },
  customStepTextDone: {
      color: '#10b981',
  },
  customFocusWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
  },
  customFocusChip: {
      backgroundColor: 'rgba(13, 108, 242, 0.12)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
  },
  customFocusText: {
      fontSize: 11,
      fontWeight: '600',
      color: CLTheme.accent,
  },
  customQuestionLabel: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: CLTheme.text.muted,
      marginBottom: 4,
  },
  customQuestionText: {
      fontSize: 13,
      lineHeight: 20,
      color: CLTheme.text.secondary,
      marginBottom: 14,
  },
  customFlowButton: {
      backgroundColor: CLTheme.accent,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
  },
  customFlowButtonSaved: {
      backgroundColor: '#10b981',
  },
  customFlowButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
  },
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      justifyContent: 'space-between',
  },
  gridCard: {
      width: (width - 56) / 2, // 20 padding * 2 = 40, + 16 gap = 56
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  gridIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
  },
  gridTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: CLTheme.text.primary,
      marginBottom: 4,
  },
  gridSubtitle: {
      fontSize: 12,
      color: CLTheme.text.secondary,
  },
  sectionContainer: {
    gap: 16,
  },
  storyCard: {
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      overflow: 'hidden',
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: CLTheme.border,
      height: 80,
  },
  storyColorStrip: {
      width: 6,
      height: '100%',
  },
  storyContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: 'space-between',
  },
  storyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  storyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: CLTheme.text.primary,
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
  },
  storyFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  tagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.03)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
  },
  tagText: {
      fontSize: 11,
      color: CLTheme.text.secondary,
  },
  questionCard: {
      backgroundColor: CLTheme.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  questionMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      paddingRight: 12,
  },
  qIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: CLTheme.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  qIndex: {
      fontSize: 12,
      fontWeight: '700',
      color: CLTheme.text.muted,
  },
  qContent: {
      flex: 1,
  },
  qText: {
      fontSize: 14,
      color: CLTheme.text.primary,
      fontWeight: '500',
      marginBottom: 2,
  },
  qCategory: {
      fontSize: 11,
      color: CLTheme.text.secondary,
  },
  practiceBtnSmall: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: 'rgba(13, 108, 242, 0.1)',
      borderRadius: 8,
  },
  practiceBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: CLTheme.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CLTheme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.accent,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalText: {
    fontSize: 16,
    color: CLTheme.text.secondary,
    lineHeight: 24,
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  modalCta: {
    backgroundColor: CLTheme.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // New Styles
  infoCard: {
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoText: {
      color: CLTheme.text.secondary,
      fontSize: 13,
      lineHeight: 18,
  },
  rubricCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  rubricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rubricTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  weightBadge: {
    backgroundColor: CLTheme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.secondary,
  },
  rubricDesc: {
    fontSize: 14,
    color: CLTheme.text.secondary,
    lineHeight: 20,
  },
  companyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
  },
  logoBoxLarge: {
      width: 64,
      height: 64,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  companyName: {
      fontSize: 24,
      fontWeight: '700',
      color: CLTheme.text.primary,
  },
  companyTicker: {
      fontSize: 14,
      color: CLTheme.text.secondary,
      fontWeight: '600',
  },
  researchSection: {
      marginBottom: 24,
      backgroundColor: CLTheme.card,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  researchTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: CLTheme.accent,
      textTransform: 'uppercase',
      marginBottom: 12,
      letterSpacing: 0.5,
  },
  researchText: {
      fontSize: 15,
      color: CLTheme.text.secondary,
      lineHeight: 22,
  },
  valueChip: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  valueText: {
      fontSize: 13,
      color: CLTheme.text.primary,
  },
  newsCard: {
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  newsHeadline: {
      fontSize: 15,
      fontWeight: '600',
      color: CLTheme.text.primary,
      marginBottom: 4,
  },
  newsDate: {
      fontSize: 12,
      color: CLTheme.text.muted,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: CLTheme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuOptionText: {
    fontSize: 16,
    color: CLTheme.text.primary,
    marginLeft: 16,
    fontWeight: '500',
  },
  menuOptionDestructive: {
    color: '#ef4444',
  },
  // --- Credits Styles ---
  creditsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CLTheme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  creditsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsBalanceText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
  },
  buyCreditsBtn: {
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  buyCreditsText: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.accent,
  },
  primaryActionBtnDisabled: {
    opacity: 0.5,
  },
  costLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  insufficientText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 16,
  },
})
