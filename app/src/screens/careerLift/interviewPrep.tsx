import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Modal
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { CLTheme } from './theme'
import Animated, { FadeInDown } from 'react-native-reanimated'

const { width } = Dimensions.get('window')

export function InterviewPrepScreen() {
  const navigation = useNavigation()
  const [showStoryBank, setShowStoryBank] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [selectedStory, setSelectedStory] = useState<any>(null)

  const readinessScore = 65

  // Navigation Logic
  const handleStartMock = () => {
    (navigation as any).navigate('MockInterview')
  }

  // Render Main Dashboard
  if (!showStoryBank && !showQuestions) {
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
                <Text style={styles.headerTitle}>Interview Prep</Text>
                <Text style={styles.headerSubtitle}>Senior Product Manager</Text>
            </View>
            <TouchableOpacity style={styles.menuButton}>
                <Feather name="more-horizontal" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Value Proposition / Readiness */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroCard}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroLabel}>READINESS SCORE</Text>
                    <Text style={styles.heroValue}>{readinessScore}%</Text>
                    <Text style={styles.heroText}>You are on track for your interview in 3 days.</Text>
                </View>
                <View style={styles.heroGraph}>
                     {/* Placeholder for circular graph visual */}
                    <View style={styles.graphCircle}>
                        <Feather name="trending-up" size={24} color={CLTheme.accent} />
                    </View>
                </View>
            </Animated.View>

            {/* Primary Action */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleStartMock}>
                    <View style={styles.actionIconBox}>
                        <MaterialIcons name="mic" size={28} color="#fff" />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.actionTitle}>Start Mock Interview</Text>
                        <Text style={styles.actionSubtitle}>Simulate a 30-min behavioral session</Text>
                    </View>
                    <Feather name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.sectionHeader}>Preparation Tools</Text>

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
                 <TouchableOpacity style={styles.gridCard}>
                    <View style={[styles.gridIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <Feather name="check-square" size={24} color="#6366f1" />
                    </View>
                    <Text style={styles.gridTitle}>Rubric</Text>
                    <Text style={styles.gridSubtitle}>Evaluation criteria</Text>
                </TouchableOpacity>

                {/* Company Research */}
                <TouchableOpacity style={styles.gridCard}>
                    <View style={[styles.gridIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                        <Feather name="search" size={24} color="#ec4899" />
                    </View>
                    <Text style={styles.gridTitle}>Research</Text>
                    <Text style={styles.gridSubtitle}>Spotify details</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
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
                }}
            >
                <Feather name="arrow-left" size={20} color={CLTheme.text.secondary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                    {showStoryBank ? 'Story Bank' : 'Practice Questions'}
                </Text>
            </View>
            <View style={{width: 40}} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            {showStoryBank && <StoriesSection onStoryPress={setSelectedStory} />}
            {showQuestions && <QuestionsSection />}
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
})
