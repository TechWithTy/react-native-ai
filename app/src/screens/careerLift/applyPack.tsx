import React, { useState } from 'react'
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Clipboard from 'expo-clipboard'
import { CLTheme } from './theme'

const COLORS = {
  primary: '#0d6cf2',
  backgroundLight: '#f5f7f8',
  backgroundDark: '#101722',
  surfaceDark: '#18212F',
  surfaceDarkHighlight: '#232d3d',
  emerald: '#10b981',
  textSecondary: '#64748b',
  border: '#334155',
}

const SimpleTab = () => (
  <View style={styles.simpleTabContainer}>
    <View style={styles.simpleCard}>
      <Text style={styles.simpleCardTitle}>Application Summary</Text>
      <View style={styles.simpleRow}>
        <Text style={styles.simpleLabel}>Role</Text>
        <Text style={styles.simpleValue}>Senior Software Engineer</Text>
      </View>
      <View style={styles.simpleRow}>
        <Text style={styles.simpleLabel}>Company</Text>
        <Text style={styles.simpleValue}>Google</Text>
      </View>
      <View style={styles.simpleRow}>
        <Text style={styles.simpleLabel}>Match Score</Text>
        <Text style={[styles.simpleValue, { color: COLORS.emerald }]}>94%</Text>
      </View>
    </View>

    <View style={styles.simpleCard}>
      <Text style={styles.simpleCardTitle}>Documents</Text>
      <View style={styles.simpleDocRow}>
        <MaterialIcons name='description' size={20} color={COLORS.primary} />
        <Text style={styles.simpleDocText}>Resume_Google_v1.pdf</Text>
      </View>
      <View style={styles.simpleDocRow}>
        <MaterialIcons name='article' size={20} color={COLORS.primary} />
        <Text style={styles.simpleDocText}>Cover Note Draft</Text>
      </View>
    </View>
  </View>
)

const AdvancedTab = () => {
  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text)
    Alert.alert('Copied', 'Text copied to clipboard')
  }

  return (
    <View style={styles.advancedContainer}>
      {/* Job Context Card */}
      <View style={styles.jobContextCard}>
        <View style={styles.logoBox}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjXTbEkWq283nWA5AsOkgv1UXkvvFod0D_xvJqOicg1s1kc8u3cgwfpTtzUs5NB8KU0ji9qzJCwbofOwNzjBayNBGM8z2VkjS-rfuHBg5n1B6ShYhOrzL_9wkpnwpsmwWkMqZF_MszjpazcycYf-9H4nXWSyyOufsNfEA_tl8V3-KGRhcDrP6LJZI59dnPbZw9qtw5blw8EacOoTL7Mexfpx1zb6CfMzTribz-Koseh5mu7ImTz8l2tuwM0Hx6y8gw-6wwLnhvj6HL',
            }}
            style={styles.logoImage}
            resizeMode='contain'
          />
        </View>
        <View style={styles.jobInfo}>
          <View style={styles.jobHeaderRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              Senior Software Engineer
            </Text>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>94% Match</Text>
            </View>
          </View>
          <Text style={styles.companyLoc}>Google • Mountain View, CA</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>FULL-TIME</Text>
            </View>
            <View style={[styles.tag, styles.tagPrimary]}>
              <Text style={[styles.tagText, styles.tagTextPrimary]}>HYBRID</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Resume Preview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TAILORED RESUME</Text>
        <View style={styles.variantBadge}>
          <Text style={styles.variantText}>Variant 1</Text>
        </View>
      </View>
      <View style={styles.resumeCard}>
        <View style={styles.resumeContent}>
          <View style={styles.pdfThumbnail}>
            <View style={styles.pdfLine1} />
            <View style={styles.pdfLine2} />
            <View style={styles.pdfLinesGroup}>
              <View style={styles.pdfLine} />
              <View style={styles.pdfLine} />
              <View style={[styles.pdfLine, { width: '75%' }]} />
              <View style={[styles.pdfLine, { marginTop: 4 }]} />
              <View style={styles.pdfLine} />
            </View>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.resumeInfo}>
            <View>
              <Text style={styles.resumeFilename}>Resume_Google_v1.pdf</Text>
              <Text style={styles.resumeMeta}>1 Page • PDF • 2.4 MB</Text>
              <Text style={styles.resumeDate}>Generated 2m ago</Text>
            </View>
            <View style={styles.resumeActions}>
              <TouchableOpacity style={styles.previewButton}>
                <MaterialIcons name='visibility' size={16} color='#e2e8f0' />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadButton}>
                <MaterialIcons name='download' size={16} color='#e2e8f0' />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Cover Note */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>COVER NOTE</Text>
        <TouchableOpacity style={styles.editLink}>
          <MaterialIcons name='edit' size={14} color={COLORS.primary} />
          <Text style={styles.editLinkText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.coverCard}>
        <View style={styles.coverTextContainer}>
          <Text style={styles.coverSalutation}>Dear Hiring Team,</Text>
          <Text style={styles.coverBody}>
            I am writing to express my strong interest in the Senior Software Engineer position at
            Google, as advertised. With over 6 years of experience building scalable distributed
            systems and a passion for cloud infrastructure...
          </Text>
          <Text style={[styles.coverBody, styles.coverBlur]}>
            I have closely followed Google's recent advancements in AI-driven search algorithms and
            believe my background in machine learning integration would be a significant asset to
            the team.
          </Text>
        </View>
        <LinearGradient
          colors={['transparent', COLORS.surfaceDark]}
          style={styles.coverOverlay}
        >
          <TouchableOpacity style={styles.readFullButton}>
            <Text style={styles.readFullText}>Read Full Note</Text>
            <MaterialIcons name='expand-more' size={16} color='#fff' />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Suggested Answers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SUGGESTED ANSWERS</Text>
      </View>
      <View style={styles.answersContainer}>
        {[
          {
            q: 'Why do you want to work here?',
            a: "I've always admired Google's commitment to organizing the world's information. Specifically, the recent work by the Cloud team on Kubernetes fits perfectly with my expertise in container orchestration...",
          },
          {
            q: 'Salary Expectations?',
            a: '$180k - $210k base salary',
            isMono: true,
          },
          {
            q: 'Notice Period?',
            a: 'I am currently available to start immediately, as my previous contract ended last week.',
          },
        ].map((item, index) => (
          <View key={index} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.questionText}>{item.q}</Text>
              <TouchableOpacity onPress={() => handleCopy(item.a)}>
                <MaterialIcons name='content-copy' size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {item.isMono ? (
              <View style={styles.monoAnswerWrap}>
                <Text style={styles.monoAnswerText}>{item.a}</Text>
              </View>
            ) : (
              <Text style={styles.answerText}>{item.a}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

export function ApplyPackScreen() {
  const navigation = useNavigation<any>()
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='chevron-left' size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Package</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name='more-horiz' size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'simple' && styles.activeTab]}
          onPress={() => setActiveTab('simple')}
        >
          <Text style={[styles.tabText, activeTab === 'simple' && styles.activeTabText]}>
            Simple
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'advanced' && styles.activeTab]}
          onPress={() => setActiveTab('advanced')}
        >
          <Text style={[styles.tabText, activeTab === 'advanced' && styles.activeTabText]}>
            Advanced
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'simple' ? <SimpleTab /> : <AdvancedTab />}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerHint}>
          <MaterialIcons name='info-outline' size={14} color='#f59e0b' />
          <Text style={styles.footerHintText}>Remember to attach the PDF manually!</Text>
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='check-circle' size={20} color='#fff' />
          <Text style={styles.ctaText}>Approve & Log Submission</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDarkHighlight,
    backgroundColor: 'rgba(16, 23, 34, 0.95)',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  // Simple Tab
  simpleTabContainer: {
    gap: 16,
  },
  simpleCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceDarkHighlight,
  },
  simpleCardTitle: {
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 12,
  },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  simpleLabel: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  simpleValue: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  simpleDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  simpleDocText: {
    color: '#fff',
    fontSize: 14,
  },

  // Advanced Tab
  advancedContainer: {
    gap: 24,
  },
  jobContextCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceDarkHighlight,
    flexDirection: 'row',
    gap: 16,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  jobInfo: {
    flex: 1,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchText: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: '600',
  },
  companyLoc: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: COLORS.surfaceDarkHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagPrimary: {
    backgroundColor: 'rgba(13, 108, 242, 0.1)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tagTextPrimary: {
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantBadge: {
    backgroundColor: 'rgba(13, 108, 242, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  variantText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  resumeCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceDarkHighlight,
  },
  resumeContent: {
    flexDirection: 'row',
    gap: 16,
  },
  pdfThumbnail: {
    width: 80,
    height: 112,
    backgroundColor: COLORS.surfaceDarkHighlight,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  pdfLine1: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 8,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  pdfLine2: {
    position: 'absolute',
    top: 24,
    left: 8,
    width: '50%',
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  pdfLinesGroup: {
    position: 'absolute',
    top: 40,
    left: 8,
    right: 8,
    gap: 6,
  },
  pdfLine: {
    height: 2,
    backgroundColor: '#64748b',
    width: '100%',
  },
  resumeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resumeFilename: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 14,
  },
  resumeMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  resumeDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceDarkHighlight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  previewButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  downloadButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceDarkHighlight,
    borderRadius: 8,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editLinkText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  coverCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceDarkHighlight,
    position: 'relative',
    overflow: 'hidden',
  },
  coverTextContainer: {
    marginBottom: 40,
  },
  coverSalutation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  coverBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  coverBlur: {
    opacity: 0.5,
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  readFullButton: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  readFullText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  answersContainer: {
    gap: 12,
  },
  answerCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceDarkHighlight,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa', // Light blue for questions in dark mode
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#cbd5e1',
  },
  monoAnswerWrap: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  monoAnswerText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDarkHighlight,
    padding: 16,
    paddingBottom: 32,
  },
  footerHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  footerHintText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
