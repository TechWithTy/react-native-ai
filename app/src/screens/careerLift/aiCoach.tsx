import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Chat } from '../chat'
import { Assistant } from '../assistant'
import { Images } from '../images'
import { Settings } from '../settings'
import { CLTheme } from './theme'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAIAgentsStore } from '../../store/aiAgentsStore'

type AICoachSection = 'chat' | 'assistant' | 'images' | 'settings'

type SectionMeta = {
  key: AICoachSection
  label: string
  icon: keyof typeof MaterialIcons.glyphMap
  subtitle: string
}

const SECTION_OPTIONS: SectionMeta[] = [
  { key: 'chat', label: 'Chat', icon: 'chat-bubble-outline', subtitle: 'General chat' },
  { key: 'assistant', label: 'Assistant', icon: 'smart-toy', subtitle: 'File-aware assistant' },
  { key: 'images', label: 'Documents', icon: 'description', subtitle: 'Create / review resume' },
  { key: 'settings', label: 'Models', icon: 'tune', subtitle: 'Model and theme' },
]

export function AICoachScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [activeSection, setActiveSection] = useState<AICoachSection>('chat')
  const voiceModeEnabled = useAIAgentsStore(state => state.voiceModeEnabled)
  const agents = useAIAgentsStore(state => state.agents)
  const selectedAgentId = useAIAgentsStore(state => state.selectedAgentId)
  const setVoiceModeEnabled = useAIAgentsStore(state => state.setVoiceModeEnabled)

  useEffect(() => {
    const nextSection = route?.params?.aiCoachSection as AICoachSection | undefined
    if (nextSection && SECTION_OPTIONS.some(option => option.key === nextSection)) {
      setActiveSection(nextSection)
    }
  }, [route?.params?.aiCoachSection])

  const activeMeta = useMemo(
    () => SECTION_OPTIONS.find(option => option.key === activeSection) || SECTION_OPTIONS[0],
    [activeSection]
  )

  return (
    <View style={styles.container}>
      {/* Header — centered title + subtitle */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Coach</Text>
        <Text style={styles.subtitle}>{activeMeta.subtitle}</Text>
        <View style={styles.voiceControlsRow}>
          <TouchableOpacity
            style={[styles.voiceTogglePill, voiceModeEnabled && styles.voiceTogglePillActive]}
            onPress={() => setVoiceModeEnabled(!voiceModeEnabled)}
            activeOpacity={0.85}
            accessibilityLabel='Toggle voice-only mode'
          >
            <MaterialIcons
              name={voiceModeEnabled ? 'keyboard-voice' : 'chat-bubble-outline'}
              size={16}
              color={voiceModeEnabled ? '#fff' : CLTheme.text.secondary}
            />
            <Text style={[styles.voiceToggleText, voiceModeEnabled && styles.voiceToggleTextActive]}>
              {voiceModeEnabled ? 'Voice Only On' : 'Text Mode'}
            </Text>
          </TouchableOpacity>

          {voiceModeEnabled ? (
            <TouchableOpacity
              style={styles.voiceLaunchButton}
              onPress={() => {
                const isInterviewPrompt = selectedAgentId === 'interview_coach'
                const activeAgent = agents.find(agent => agent.id === selectedAgentId)
                const voiceCategory = `${activeAgent?.label || 'General'} Voice`
                if (isInterviewPrompt) {
                  navigation.navigate('InterviewPrep', {
                    aiCoachVoiceMode: true,
                    aiCoachSection: activeSection,
                  })
                  return
                }
                navigation.navigate('MockInterview', {
                  aiVoiceMode: true,
                  category: voiceCategory,
                })
              }}
              activeOpacity={0.88}
              accessibilityLabel='Open interview prep voice mode'
            >
              <MaterialIcons name='call' size={15} color='#fff' />
              <Text style={styles.voiceLaunchButtonText}>Open Voice Prep</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tab bar — underline indicator style */}
      <View style={styles.tabBar}>
        {SECTION_OPTIONS.map(option => {
          const active = activeSection === option.key
          return (
            <TouchableOpacity
              key={option.key}
              accessibilityLabel={`Open AI Coach ${option.label}`}
              style={styles.tabItem}
              onPress={() => setActiveSection(option.key)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={option.icon}
                size={20}
                color={active ? CLTheme.accent : CLTheme.text.muted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{option.label}</Text>
              {active && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Content panels */}
      <View style={styles.content}>
        <View style={[styles.panel, activeSection !== 'chat' && styles.hiddenPanel]}>
          <Chat />
        </View>
        <View style={[styles.panel, activeSection !== 'assistant' && styles.hiddenPanel]}>
          <Assistant />
        </View>
        <View style={[styles.panel, activeSection !== 'images' && styles.hiddenPanel]}>
          <Images />
        </View>
        <View style={[styles.panel, activeSection !== 'settings' && styles.hiddenPanel]}>
          <Settings />
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    backgroundColor: CLTheme.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: CLTheme.text.primary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: CLTheme.text.muted,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  voiceControlsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  voiceTogglePillActive: {
    backgroundColor: CLTheme.accent,
    borderColor: CLTheme.accent,
  },
  voiceToggleText: {
    color: CLTheme.text.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  voiceToggleTextActive: {
    color: '#fff',
  },
  voiceLaunchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  voiceLaunchButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: CLTheme.card,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: CLTheme.text.muted,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: CLTheme.accent,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    borderRadius: 2,
    backgroundColor: CLTheme.accent,
  },
  content: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  panel: {
    flex: 1,
  },
  hiddenPanel: {
    display: 'none',
  },
})
