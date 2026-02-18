import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Chat } from '../chat'
import { Assistant } from '../assistant'
import { Images } from '../images'
import { Settings } from '../settings'
import { CLTheme } from './theme'

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
  { key: 'images', label: 'Images', icon: 'image', subtitle: 'Generate or upload' },
  { key: 'settings', label: 'Models', icon: 'tune', subtitle: 'Model and theme' },
]

export function AICoachScreen() {
  const [activeSection, setActiveSection] = useState<AICoachSection>('chat')

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
