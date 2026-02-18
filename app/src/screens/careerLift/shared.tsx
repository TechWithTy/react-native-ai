import { ReactNode, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { CLTheme } from './theme'

export type MockSection = {
  title: string
  body?: string
  items?: string[]
}

type MockScreenProps = {
  title: string
  subtitle?: string
  sections: MockSection[]
  cta?: string
  onBack?: () => void
  onCta?: () => void
  chips?: string[]
  footerTabs?: Array<{ label: string; active?: boolean }>
}

export function MockScreen({
  title,
  subtitle,
  sections,
  cta,
  onBack,
  onCta,
  chips,
  footerTabs,
}: MockScreenProps) {
  const styles = useStyles()

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Feather name='arrow-left' size={16} color={CLTheme.text.secondary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, cta || footerTabs ? { paddingBottom: 110 } : null]}>
        {chips?.length ? (
          <View style={styles.chipsWrap}>
            {chips.map(chip => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {sections.map((section, index) => (
          <View key={`${section.title}-${index}`} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body ? <Text style={styles.body}>{section.body}</Text> : null}
            {section.items?.map(item => (
              <View key={item} style={styles.listRow}>
                <View style={styles.dot} />
                <Text style={styles.item}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {cta ? (
        <View style={styles.bottomDock}>
          <TouchableOpacity style={styles.cta} onPress={onCta}>
            <Text style={styles.ctaText}>{cta}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {footerTabs?.length ? (
        <View style={styles.tabBar}>
          {footerTabs.map(tab => (
            <View key={tab.label} style={styles.tabItem}>
              <Text style={[styles.tabText, tab.active ? styles.tabTextActive : null]}>{tab.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  )
}

export function useStyles() {
  return useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: CLTheme.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: CLTheme.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        iconBtn: {
          width: 34,
          height: 34,
          borderRadius: 99,
          borderWidth: 1,
          borderColor: CLTheme.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CLTheme.card,
        },
        headerText: {
          flex: 1,
        },
        subtitle: {
          color: CLTheme.text.muted,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.7,
          fontWeight: '600',
        },
        title: {
          color: CLTheme.text.primary,
          fontSize: 21,
          fontWeight: '700',
        },
        content: {
          padding: 16,
          gap: 10,
        },
        chipsWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          borderWidth: 1,
          borderColor: CLTheme.border,
          backgroundColor: CLTheme.card,
          borderRadius: 99,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        chipText: {
          color: '#93c5fd', // Keeping this custom for now or use CLTheme
          fontWeight: '600',
          fontSize: 11,
        },
        card: {
          borderWidth: 1,
          borderColor: CLTheme.border,
          backgroundColor: CLTheme.card,
          borderRadius: 14,
          padding: 14,
          gap: 8,
        },
        sectionTitle: {
          color: CLTheme.text.primary,
          fontSize: 14,
          fontWeight: '700',
        },
        body: {
          color: CLTheme.text.secondary,
          fontSize: 13,
          lineHeight: 19,
        },
        listRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 99,
          backgroundColor: CLTheme.accent,
        },
        item: {
          color: '#cbd5e1', // Light slate
          fontSize: 13,
          flexShrink: 1,
        },
        bottomDock: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: CLTheme.border,
          backgroundColor: CLTheme.background,
          padding: 14,
        },
        cta: {
          backgroundColor: CLTheme.accent,
          borderRadius: 12,
          paddingVertical: 13,
          alignItems: 'center',
        },
        ctaText: {
          color: '#fff',
          fontWeight: '700',
          fontSize: 14,
        },
        tabBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: CLTheme.border,
          backgroundColor: CLTheme.card,
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 12,
        },
        tabItem: {
          paddingHorizontal: 10,
        },
        tabText: {
          color: CLTheme.text.muted,
          fontSize: 11,
          fontWeight: '600',
        },
        tabTextActive: {
          color: CLTheme.accent,
        },
      }),
    []
  )
}

export function card(title: string, body?: string, items?: string[]): MockSection {
  return { title, body, items }
}
