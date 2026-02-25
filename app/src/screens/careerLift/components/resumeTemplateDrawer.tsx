import React, { useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { CLTheme, CLThemeTokens, useCLTheme } from '../theme'
import { CREDIT_COSTS, useCreditsStore } from '../../../store/creditsStore'

// ─── Template Definitions ────────────────────────────────────────
export type ResumeTemplate = {
  id: string
  name: string
  description: string
  icon: keyof typeof MaterialIcons.glyphMap
  creditCost: number
  tag?: string
  tagColor?: string
  previewImageUrl: string
  previewPdfUrl: string
}

const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'standard',
    name: 'ATS-Optimized',
    description: 'Clean, structured format designed to pass ATS scans with maximum keyword density.',
    icon: 'description',
    creditCost: CREDIT_COSTS.resumeTailor,
    previewImageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'Senior-level format with achievement highlights, leadership metrics, and board-ready polish.',
    icon: 'workspace-premium',
    creditCost: CREDIT_COSTS.resumeTailor + 2,
    tag: 'POPULAR',
    tagColor: '#f59e0b',
    previewImageUrl: 'https://images.unsplash.com/photo-1626125345510-4603468ecd1c?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Modern layout with visual flair — ideal for design, marketing, and creative roles.',
    icon: 'palette',
    creditCost: CREDIT_COSTS.resumeTailor + 1,
    previewImageUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'tech',
    name: 'Tech & Engineering',
    description: 'Optimized for engineering roles with project highlights, tech stack sections, and open source.',
    icon: 'terminal',
    creditCost: CREDIT_COSTS.resumeTailor + 1,
    tag: 'NEW',
    tagColor: '#10b981',
    previewImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
]

const COVER_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'tailored',
    name: 'AI-Tailored Letter',
    description: 'Personalized cover letter matched to the job description with role-specific keywords.',
    icon: 'auto-awesome',
    creditCost: CREDIT_COSTS.coverLetterGen,
    tag: 'RECOMMENDED',
    tagColor: '#0d6cf2',
    previewImageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'networking',
    name: 'Networking Intro',
    description: 'Warm intro letter for referral-based applications with a personal touch.',
    icon: 'people',
    creditCost: CREDIT_COSTS.coverLetterGen,
    previewImageUrl: 'https://images.unsplash.com/photo-1521791136064-7986cbf03fda?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'follow-up',
    name: 'Follow-Up Note',
    description: 'Post-interview or post-application follow-up to reinforce your candidacy.',
    icon: 'reply',
    creditCost: CREDIT_COSTS.coverLetterGen - 1,
    previewImageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    previewPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
]

// ─── Props ───────────────────────────────────────────────────────
type ResumeTemplateDrawerProps = {
  visible: boolean
  onClose: () => void
  mode: 'resume' | 'coverLetter'
  jobContext?: string
  onGenerated?: (templateId: string) => void
}

// ─── Component ───────────────────────────────────────────────────
export function ResumeTemplateDrawer({
  visible,
  onClose,
  mode,
  jobContext,
  onGenerated,
}: ResumeTemplateDrawerProps) {
  const clTheme = useCLTheme()
  const styles = getStyles(clTheme)
  const templates = mode === 'resume' ? RESUME_TEMPLATES : COVER_TEMPLATES

  const { balance, canAfford, spendCredits } = useCreditsStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null)
  const creditColor = balance > 30 ? '#10b981' : balance > 10 ? '#f59e0b' : '#ef4444'

  const selected = templates.find(t => t.id === selectedId)

  const handleGenerate = () => {
    if (!selected) {
      Alert.alert('Select a template', 'Please choose a template first.')
      return
    }
    if (balance < selected.creditCost) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${selected.creditCost} credits. You have ${balance}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => { /* TODO: open subscription modal */ } },
        ]
      )
      return
    }
    const action = mode === 'resume' ? 'resumeTailor' : 'coverLetterGen'
    spendCredits(action, `${selected.name}${jobContext ? ` for ${jobContext}` : ''}`)
    Alert.alert(
      'Generation Started',
      `Your ${selected.name} is being generated. It'll appear in Documents & Insights.`
    )
    onGenerated?.(selected.id)
    onClose()
  }

  const handleOpenTemplatePdf = async (template: ResumeTemplate) => {
    try {
      const canOpen = await Linking.canOpenURL(template.previewPdfUrl)
      if (!canOpen) {
        Alert.alert('Unable to open PDF', 'Your device cannot open this PDF preview right now.')
        return
      }
      await Linking.openURL(template.previewPdfUrl)
    } catch {
      Alert.alert('Unable to open PDF', 'Could not open the PDF preview.')
    }
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.drawer} onPress={() => null}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.drawerTitle}>
                {mode === 'resume' ? 'Resume Templates' : 'Cover Letter Templates'}
              </Text>
              <Text style={styles.drawerSubtitle}>
                Choose a template to generate with AI
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={clTheme.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Credit Badge */}
          <View style={styles.creditBadge}>
            <Feather name="zap" size={14} color={creditColor} />
            <Text style={[styles.creditText, { color: creditColor }]}>{balance} credits</Text>
          </View>

          {/* Templates */}
          <ScrollView
            style={styles.templateList}
            contentContainerStyle={styles.templateListContent}
            showsVerticalScrollIndicator={false}
          >
            {templates.map(template => {
              const isSelected = selectedId === template.id
              const affordable = balance >= template.creditCost
              return (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    isSelected && styles.templateCardSelected,
                    !affordable && styles.templateCardDisabled,
                  ]}
                  onPress={() => setSelectedId(template.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateRow}>
                    <View style={[styles.templateIcon, isSelected && styles.templateIconSelected]}>
                      <MaterialIcons
                        name={template.icon}
                        size={22}
                        color={isSelected ? '#fff' : clTheme.accent}
                      />
                    </View>
                    <View style={styles.templateInfo}>
                      <View style={styles.templateNameRow}>
                        <Text style={[styles.templateName, isSelected && styles.templateNameSelected]}>
                          {template.name}
                        </Text>
                        {template.tag ? (
                          <View style={[styles.templateTag, { backgroundColor: `${template.tagColor}20` }]}>
                            <Text style={[styles.templateTagText, { color: template.tagColor }]}>
                              {template.tag}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.templateDesc} numberOfLines={2}>
                        {template.description}
                      </Text>
                      <View style={styles.previewActionRow}>
                        <TouchableOpacity
                        style={styles.previewLink}
                        onPress={() => setPreviewTemplate(template)}
                        testID={`template-preview-image-${template.id}`}
                      >
                        <Feather name="eye" size={12} color={clTheme.accent} />
                        <Text style={styles.previewLinkText}>View Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.previewLink}
                          onPress={() => handleOpenTemplatePdf(template)}
                          testID={`template-preview-pdf-${template.id}`}
                        >
                          <Feather name="download" size={12} color={clTheme.accent} />
                          <Text style={styles.previewLinkText}>Download PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.templateCost}>
                      <Text style={[styles.costNumber, !affordable && styles.costInsufficient]}>
                        {template.creditCost}
                      </Text>
                      <Text style={styles.costLabel}>cr</Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <View style={styles.selectedIndicator}>
                      <Feather name="check-circle" size={16} color={clTheme.accent} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              )
            })}

            {/* Upsell Banner */}
            <View style={styles.upsellBanner}>
              <MaterialIcons name="auto-awesome" size={20} color="#f59e0b" />
              <View style={styles.upsellText}>
                <Text style={styles.upsellTitle}>Unlock all templates</Text>
                <Text style={styles.upsellBody}>
                  Upgrade to Pro for 50 credits/month and unlimited template access.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={clTheme.text.muted} />
            </View>
          </ScrollView>

          {/* CTA */}
          <View style={styles.ctaArea}>
            <TouchableOpacity
              style={[styles.ctaButton, !selected && styles.ctaButtonDisabled]}
              onPress={handleGenerate}
              disabled={!selected}
              activeOpacity={0.85}
            >
              <MaterialIcons name="auto-awesome" size={18} color="#fff" />
              <Text style={styles.ctaText}>
                {selected
                  ? `Generate  ·  ${selected.creditCost} credits`
                  : 'Select a template'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={!!previewTemplate}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewTemplate(null)}
      >
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewTemplate(null)}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Template Preview</Text>
              <TouchableOpacity onPress={() => setPreviewTemplate(null)} style={styles.previewClose}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {previewTemplate && (
              <Image 
                source={{ uri: previewTemplate.previewImageUrl }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.previewPdfButton}
                onPress={() => previewTemplate && handleOpenTemplatePdf(previewTemplate)}
                testID='template-preview-modal-download-pdf'
              >
                <Feather name='download' size={14} color='#fff' />
                <Text style={styles.previewPdfButtonText}>Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewTemplate(null)}>
                <Text style={styles.previewCloseBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

// ─── Styles ──────────────────────────────────────────────────────
const getStyles = (CLTheme: CLThemeTokens) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    drawer: {
      backgroundColor: CLTheme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      paddingBottom: 24,
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: CLTheme.border,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 8,
    },
    drawerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: CLTheme.text.primary,
    },
    drawerSubtitle: {
      fontSize: 13,
      color: CLTheme.text.muted,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    creditBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginLeft: 20,
      marginBottom: 12,
      backgroundColor: CLTheme.card,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: CLTheme.border,
    },
    creditText: {
      fontSize: 13,
      fontWeight: '600',
    },
    templateList: {
      flexGrow: 0,
    },
    templateListContent: {
      paddingHorizontal: 20,
      gap: 10,
      paddingBottom: 16,
    },
    templateCard: {
      backgroundColor: CLTheme.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.5,
      borderColor: CLTheme.border,
      position: 'relative',
    },
    templateCardSelected: {
      borderColor: CLTheme.accent,
      backgroundColor: 'rgba(13,108,242,0.06)',
    },
    templateCardDisabled: {
      opacity: 0.55,
    },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    templateIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(13,108,242,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    templateIconSelected: {
      backgroundColor: CLTheme.accent,
    },
    templateInfo: {
      flex: 1,
    },
    templateNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    templateName: {
      fontSize: 15,
      fontWeight: '600',
      color: CLTheme.text.primary,
    },
    templateNameSelected: {
      color: CLTheme.accent,
    },
    templateTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    templateTagText: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    templateDesc: {
      fontSize: 12,
      color: CLTheme.text.muted,
      lineHeight: 16,
      marginTop: 3,
    },
    templateCost: {
      alignItems: 'center',
      minWidth: 40,
    },
    costNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: CLTheme.text.primary,
    },
    costInsufficient: {
      color: '#ef4444',
    },
    costLabel: {
      fontSize: 10,
      color: CLTheme.text.muted,
      fontWeight: '600',
    },
    selectedIndicator: {
      position: 'absolute',
      top: 10,
      right: 10,
    },
    upsellBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(245,158,11,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.25)',
      borderRadius: 14,
      padding: 14,
      marginTop: 6,
    },
    upsellText: {
      flex: 1,
    },
    upsellTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#f59e0b',
    },
    upsellBody: {
      fontSize: 12,
      color: CLTheme.text.muted,
      marginTop: 2,
      lineHeight: 16,
    },
    ctaArea: {
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: CLTheme.border,
    },
    ctaButton: {
      backgroundColor: CLTheme.accent,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: CLTheme.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    ctaButtonDisabled: {
      backgroundColor: CLTheme.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    ctaText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    previewLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    previewActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      marginTop: 2,
    },
    previewLinkText: {
      fontSize: 11,
      fontWeight: '600',
      color: CLTheme.accent,
    },
    previewOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    previewContent: {
      width: '100%',
      backgroundColor: '#1a1a1a',
      borderRadius: 20,
      overflow: 'hidden',
      maxHeight: '80%',
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
    },
    previewTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    previewClose: {
      padding: 4,
    },
    previewImage: {
      width: '100%',
      aspectRatio: 1 / 1.414, // A4 aspect ratio
      backgroundColor: '#f5f5f5',
    },
    previewCloseBtn: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
      backgroundColor: '#333',
      borderRadius: 10,
      flex: 1,
    },
    previewCloseBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    previewFooter: {
      flexDirection: 'row',
      gap: 10,
      padding: 14,
      backgroundColor: '#222',
    },
    previewPdfButton: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: '#0d6cf2',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      flex: 1,
    },
    previewPdfButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
  })
