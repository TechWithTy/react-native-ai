import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAtsScanStore, AtsFix } from '../../store/atsScanStore'
import { useNavigation } from '@react-navigation/native'

import { CLTheme } from './theme'

const { width } = Dimensions.get('window')

type ATSResultsProps = {
  route?: {
    params?: {
      resumeName?: string
    }
  }
}

export function ATSResultsScreen({ route }: ATSResultsProps = {}) {
  const { score, keywordsFound, keywordsMissing, fixes } = useAtsScanStore()
  const navigation = useNavigation()
  const scannedResumeName = route?.params?.resumeName

  const renderFixCard = (fix: AtsFix) => (
    <View
      key={fix.id}
      style={[
        styles.fixCard,
        fix.level === 'P0' ? styles.fixCardRed : styles.fixCardGray,
      ]}
    >
      <View style={styles.fixHeader}>
        <View
          style={[
            styles.fixIconBox,
            fix.level === 'P0'
              ? { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
              : fix.level === 'P1'
              ? { backgroundColor: 'rgba(13, 108, 242, 0.1)' }
              : { backgroundColor: 'rgba(249, 115, 22, 0.1)' },
          ]}
        >
          <MaterialIcons
            name={
              fix.level === 'P0'
                ? 'priority-high'
                : fix.level === 'P1'
                ? 'insights'
                : 'spellcheck'
            }
            size={18}
            color={
              fix.level === 'P0'
                ? CLTheme.status.danger
                : fix.level === 'P1'
                ? CLTheme.accent
                : CLTheme.status.warning
            }
          />
        </View>
        <View style={styles.fixContent}>
          <View style={styles.fixTitleRow}>
            <Text
              style={[
                styles.fixTitle,
                fix.level === 'P0' && { color: CLTheme.status.danger },
              ]}
            >
              {fix.title} ({fix.level})
            </Text>
            <View
              style={[
                styles.fixTag,
                fix.level === 'P0' ? styles.bgRedTag : styles.bgGrayTag,
              ]}
            >
              <Text
                style={[
                  styles.fixTagText,
                  fix.level === 'P0' && { color: CLTheme.status.danger },
                ]}
              >
                {fix.tag}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.fixDesc,
              fix.level === 'P0' && { color: CLTheme.status.danger, opacity: 0.8 },
            ]}
          >
            {fix.description}
          </Text>
          {fix.level === 'P0' && (
            <TouchableOpacity style={styles.autoFixLink}>
              <Text style={styles.autoFixText}>Auto-fix this issue</Text>
              <MaterialIcons name="arrow-forward" size={14} color={CLTheme.status.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <MaterialIcons name="chevron-left" size={28} color={CLTheme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="share" size={24} color={CLTheme.text.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {scannedResumeName ? (
          <View style={styles.sourceResumeBadge}>
            <MaterialIcons name='description' size={14} color={CLTheme.accent} />
            <Text style={styles.sourceResumeText}>Scanned resume: {scannedResumeName}</Text>
          </View>
        ) : null}

        {/* Score Ring */}
        <View style={styles.scoreContainer}>
          <View style={styles.ringContainer}>
            {/* Simple mock ring using borders for now, ideally SVG or Reanimated */}
            <View style={styles.outerRing}>
              <View style={styles.innerRing} />
            </View>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreValue}>
                {score}
                <Text style={styles.scorePercent}>%</Text>
              </Text>
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>Good Match</Text>
              </View>
            </View>
          </View>
          <Text style={styles.scoreSubtext}>
            Your resume is readable but misses key terms for this role.
          </Text>
        </View>

        {/* Keyword Map */}
        <View style={styles.sectionMap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="radar" size={20} color={CLTheme.accent} />
              <Text style={styles.sectionTitle}>Keyword Map</Text>
            </View>
            <Text style={styles.subtitle}>
              {keywordsFound.length} Found • {keywordsMissing.length} Missing
            </Text>
          </View>
          <View style={styles.keywordContainer}>
            {keywordsFound.map((kw) => (
              <View key={kw} style={styles.foundChip}>
                <MaterialIcons name="check" size={12} color={CLTheme.accent} />
                <Text style={styles.foundText}>{kw}</Text>
              </View>
            ))}
            {keywordsMissing.map((kw) => (
              <View key={kw} style={styles.missingChip}>
                <MaterialIcons name="close" size={12} color={CLTheme.text.muted} />
                <Text style={styles.missingText}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Priority Fixes */}
        <View style={styles.sectionFixes}>
          <Text style={styles.listTitle}>Priority Fixes</Text>
          {fixes.map(renderFixCard)}
        </View>

        {/* Parser Preview */}
        <View style={styles.parserContainer}>
          <View style={styles.parserHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="code" size={20} color={CLTheme.text.secondary} />
              <Text style={styles.parserTitle}>Robot Vision</Text>
            </View>
            <View style={styles.rawBadge}>
              <Text style={styles.rawText}>RAW TEXT</Text>
            </View>
          </View>
          <View style={styles.terminalBox}>
            <Text style={styles.terminalText}>
              <Text style={{ color: CLTheme.text.muted }}>&gt;&gt;&gt; PARSING HEADER...</Text>
              {'\n'}NAME: Jane Doe{'\n'}
              EMAIL: jane.doe@email.com{'\n'}
              PHONE: [NOT FOUND]{'\n'}
              <Text style={{ color: CLTheme.text.muted }}>&gt;&gt;&gt; PARSING EXPERIENCE...</Text>
              {'\n'}ROLE: Senior PM{'\n'}
              COMPANY: TechFlow Inc.{'\n'}
              <Text style={{ color: CLTheme.text.muted }}>&gt;&gt;&gt; ANALYZING GAPS...</Text>
              {'\n'}CRITICAL_ERROR: Header image...
            </Text>
          </View>
          <TouchableOpacity style={styles.expandButton}>
            <Text style={styles.expandText}>Expand Full Preview</Text>
            <MaterialIcons name="expand-more" size={16} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaButton}>
          <MaterialIcons name="auto-fix-high" size={20} color="#fff" />
          <Text style={styles.ctaText}>Generate Tailored Resume</Text>
        </TouchableOpacity>
        <View style={styles.homeIndicator} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: CLTheme.background, // removed transparency for simplicity in dark mode or make it absolute
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sourceResumeBadge: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.3)',
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sourceResumeText: {
    fontSize: 12,
    color: CLTheme.accent,
    fontWeight: '600',
  },
  ringContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: CLTheme.border,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: CLTheme.accent,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  scoreTextContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: CLTheme.text.primary,
    letterSpacing: -2,
  },
  scorePercent: {
    fontSize: 24,
    color: CLTheme.text.secondary,
    fontWeight: '500',
  },
  matchBadge: {
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  matchText: {
    color: CLTheme.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  scoreSubtext: {
    textAlign: 'center',
    color: CLTheme.text.muted,
    fontSize: 14,
    marginTop: 16,
    maxWidth: 200,
  },
  sectionMap: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: CLTheme.border,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    fontWeight: '500',
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.3)',
    gap: 4,
  },
  foundText: {
    fontSize: 12,
    fontWeight: '500',
    color: CLTheme.accent,
  },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: CLTheme.border,
    borderWidth: 1,
    borderColor: CLTheme.text.muted,
    borderStyle: 'dashed',
    opacity: 0.7,
    gap: 4,
  },
  missingText: {
    fontSize: 12,
    fontWeight: '500',
    color: CLTheme.text.muted,
  },
  sectionFixes: {
    gap: 12,
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  fixCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  fixCardRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  fixCardGray: {
    backgroundColor: CLTheme.card,
    borderColor: CLTheme.border,
  },
  fixHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  fixIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixContent: {
    flex: 1,
  },
  fixTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fixTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  fixTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bgRedTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  bgGrayTag: {
    backgroundColor: CLTheme.border,
  },
  fixTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: CLTheme.text.secondary,
  },
  fixDesc: {
    fontSize: 12,
    color: CLTheme.text.secondary,
    lineHeight: 18,
  },
  autoFixLink: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoFixText: {
    fontSize: 12,
    fontWeight: '600',
    color: CLTheme.status.danger,
  },
  parserContainer: {
    backgroundColor: '#0f172a', // Keep this dark as intended for terminal look, or match CLTheme.background
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  parserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parserTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  rawBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rawText: {
    color: CLTheme.text.secondary,
    fontSize: 10,
  },
  terminalBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 12,
    height: 128,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#4ade80',
    lineHeight: 16,
  },
  expandButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  expandText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CLTheme.card, // opaque card color
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    paddingBottom: 40,
  },
  ctaButton: {
    backgroundColor: CLTheme.accent,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  homeIndicator: {
    width: '30%',
    height: 4,
    backgroundColor: CLTheme.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 20,
  },
})
