import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  withDelay,
} from 'react-native-reanimated'
import { useNavigation, useRoute } from '@react-navigation/native'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { CLTheme } from './theme'


const { width } = Dimensions.get('window')

export function MockInterviewScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const params = route.params as { question?: string; category?: string } | undefined
  
  const questionText = params?.question || "Describe a situation where you had to manage a difficult stakeholder. How did you handle it?"
  const sessionCategory = params?.category || "Behavioral"

  const [isRecording, setIsRecording] = useState(false)
  const [showRubric, setShowRubric] = useState(false)
  const [timeLeft, setTimeLeft] = useState(105) // 01:45 = 105 seconds
  const [transcriptIndex, setTranscriptIndex] = useState(0)
  
  // Animation Values
  const pulseAnim = useSharedValue(1)
  const recordRipple = useSharedValue(0)
  
  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timeLeft])

  // Formatting Timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Pulsing Dot Animation (Red dot in timer)
  const dotOpacity = useSharedValue(1)
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    )
  }, [])

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }))

  // Record Button Ripple
  useEffect(() => {
    if (isRecording) {
      recordRipple.value = withRepeat(
        withTiming(1.2, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    } else {
      recordRipple.value = 0
    }
  }, [isRecording])

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? recordRipple.value : 1 }],
    opacity: isRecording ? withRepeat(withTiming(0, { duration: 1500 }), -1, false) : 0,
  }))

  // Transcript Simulation
  const fullTranscript = "So, in my previous role, I encountered a situation where the client's expectations were..."
  useEffect(() => {
    if (isRecording && transcriptIndex < fullTranscript.length) {
      const timeout = setTimeout(() => {
        setTranscriptIndex((prev) => prev + 1)
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [isRecording, transcriptIndex])

  const displayedTranscript = fullTranscript.substring(0, transcriptIndex)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color={CLTheme.text.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{sessionCategory.toUpperCase()}</Text>
          <View style={styles.progressDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="more-horiz" size={24} color={CLTheme.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Animated.View style={[styles.pulsingDot, dotStyle]} />
          </View>
          <Text style={styles.timerLabel}>Time Remaining</Text>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          {/* Background decoration */}
          <View style={styles.cardDecoration} />
          
          <View style={styles.questionHeader}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Q2 OF 5</Text>
            </View>
          </View>

          <Text style={styles.questionText}>
            {questionText}
          </Text>

          {/* Rubric Toggle */}
          <TouchableOpacity 
            style={styles.rubricToggle} 
            onPress={() => setShowRubric(prev => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.rubricHeader}>
              <MaterialIcons 
                name="expand-more" 
                size={20} 
                color={CLTheme.accent} 
                style={{ transform: [{ rotate: showRubric ? '180deg' : '0deg' }] }}
              />
              <Text style={styles.rubricToggleText}>Show Evaluation Rubric</Text>
            </View>
            
            {showRubric && (
               <View style={styles.rubricContent}>
                 <RubricItem label="Conflict Resolution:" text="Did you maintain professional composure?" />
                 <RubricItem label="Empathy:" text="Did you understand their perspective?" />
                 <RubricItem label="Outcome:" text="Was the resolution positive for the business?" />
               </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Live Transcript / Waveform */}
        <View style={styles.transcriptArea}>
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>
              "{displayedTranscript}
              <Text style={{ color: CLTheme.accent, fontWeight: '900' }}>|</Text>"
            </Text>
          </View>
          
          {/* Visualizer */}
          <View style={[styles.visualizer, { opacity: isRecording ? 1 : 0.5 }]}>
            {Array.from({ length: 30 }).map((_, i) => (
              <VisualizerBar key={i} index={i} isRecording={isRecording} />
            ))}
          </View>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Reset Button */}
          <TouchableOpacity 
            style={styles.controlBtnSecondary}
            onPress={() => {
              setTranscriptIndex(0)
              setIsRecording(false)
              setTimeLeft(105)
            }}
          >
            <View style={styles.circleBtnSmall}>
              <MaterialIcons name="restart-alt" size={24} color={CLTheme.text.secondary} />
            </View>
            <Text style={styles.btnLabel}>Reset</Text>
          </TouchableOpacity>

          {/* Record Button */}
          <View style={styles.recordBtnWrapper}>
             <Animated.View style={[styles.recordRipple, rippleStyle]} />
             <TouchableOpacity 
               style={styles.recordButton}
               onPress={() => setIsRecording(prev => !prev)}
               activeOpacity={0.9}
             >
                {isRecording ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <View style={styles.recordIcon} /> // Changed to just circle or square
                )}
             </TouchableOpacity>
          </View>

          {/* Done Button */}
          <TouchableOpacity 
            style={styles.controlBtnSecondary}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.circleBtnSmall}>
              <MaterialIcons name="check" size={24} color={CLTheme.text.secondary} />
            </View>
            <Text style={styles.btnLabel}>Done</Text>
          </TouchableOpacity>
        </View>
        
        {/* iOS Home Indicator Spacer */}
        <View style={styles.homeIndicator} />
      </View>
    </SafeAreaView>
  )
}

function RubricItem({ label, text }: { label: string, text: string }) {
  return (
    <View style={styles.rubricItem}>
      <Text style={styles.rubricLabel}>{label}</Text>
      <Text style={styles.rubricText}>{text}</Text>
    </View>
  )
}

function VisualizerBar({ index, isRecording }: { index: number, isRecording: boolean }) {
  const height = useSharedValue(Math.random() * 20 + 4)
  
  useEffect(() => {
    if (isRecording) {
      height.value = withRepeat(
        withTiming(Math.random() * 24 + 8, { duration: Math.random() * 300 + 200 }),
        -1,
        true
      )
    } else {
       height.value = withTiming(4, { duration: 500 })
    }
  }, [isRecording])

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }))

  return <Animated.View style={[styles.bar, animatedStyle]} />
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CLTheme.card, // surface-dark equivalent
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: CLTheme.accent,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(13, 108, 242, 0.3)', // primary/30
  },
  dotActive: {
    backgroundColor: CLTheme.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  timerContainer: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 60,
    fontWeight: '300',
    color: CLTheme.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    position: 'relative',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444', // red-500
    marginTop: 15,
    marginLeft: -4, // Adjust based on visual
    position: 'absolute',
    right: -12,
    top: 0,
  },
  timerLabel: {
    fontSize: 14,
    color: CLTheme.text.secondary,
    marginTop: 4,
  },
  questionCard: {
    backgroundColor: CLTheme.card, // surface-dark
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(13, 108, 242, 0.1)', // primary/10
    zIndex: -1,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badgeContainer: {
    backgroundColor: 'rgba(13, 108, 242, 0.2)', // primary/20
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: CLTheme.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: CLTheme.text.primary,
    lineHeight: 30,
    marginBottom: 16,
  },
  rubricToggle: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
  },
  rubricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rubricToggleText: {
    color: CLTheme.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  rubricContent: {
    marginTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(13, 108, 242, 0.3)',
    gap: 8,
  },
  rubricItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rubricLabel: {
    color: CLTheme.accent,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
  rubricText: {
    color: CLTheme.text.secondary,
    fontSize: 14,
  },
  transcriptArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  transcriptContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  transcriptText: {
    fontSize: 18,
    color: CLTheme.text.secondary, // gray-400
    fontWeight: '500',
    lineHeight: 28,
  },

  visualizer: {
    height: 40, // Reduced from HTML because 64px might be tall in this layout
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 10,
  },
  bar: {
    width: 4,
    backgroundColor: CLTheme.accent,
    borderRadius: 2,
  },
  controlsContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: CLTheme.background,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlBtnSecondary: {
    alignItems: 'center',
    gap: 4,
  },
  circleBtnSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CLTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 12,
    color: CLTheme.text.muted,
    fontWeight: '500',
  },
  recordBtnWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
  },
  recordRipple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 108, 242, 0.3)',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  recordIcon: {
    width: 32, 
    height: 32,
    backgroundColor: '#fff', 
    borderRadius: 16,
  },
  stopIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 4, // Square
  },
  homeIndicator: {
    height: 4,
    width: 120,
    backgroundColor: CLTheme.text.muted,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 16,
    opacity: 0.3,
  }
})
