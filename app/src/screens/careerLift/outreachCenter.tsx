import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as Clipboard from 'expo-clipboard'
import { CLTheme } from './theme'
import { CREDIT_COSTS, useCreditsStore } from '../../store/creditsStore'
import { JobEntry, useJobTrackerStore } from '../../store/jobTrackerStore'
import { buildOutreachDraft, isOutreachAction } from './outreachHelpers'

type OutreachCenterRouteParams = {
  job?: JobEntry
  jobId?: string
}

const OUTREACH_SENT_PREFIX = '[Outreach sent'

export function OutreachCenterScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { thisWeek, nextUp, updateJobNotes } = useJobTrackerStore()
  const { balance: creditBalance, canAfford, spendCredits } = useCreditsStore()
  const outreachCost = CREDIT_COSTS.outreachMessageGen
  const canAffordOutreach = canAfford('outreachMessageGen')
  const creditColor = creditBalance > 30 ? '#10b981' : creditBalance > 10 ? '#f59e0b' : '#ef4444'

  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null)
  const [outreachDraft, setOutreachDraft] = useState('')
  const [showOutreachDrawer, setShowOutreachDrawer] = useState(false)

  const routeParams = (route as any)?.params as OutreachCenterRouteParams | undefined

  const outreachJobs = useMemo(() => {
    return [...thisWeek, ...nextUp].filter(job => isOutreachAction(job.nextAction))
  }, [thisWeek, nextUp])

  const sentThisWeek = useMemo(() => {
    return outreachJobs.filter(job => job.notes?.includes(OUTREACH_SENT_PREFIX)).length
  }, [outreachJobs])

  const pendingJobs = Math.max(0, outreachJobs.length - sentThisWeek)

  const openOutreachDrawer = (job: JobEntry) => {
    setSelectedJob(job)
    setOutreachDraft('')
    setShowOutreachDrawer(true)
  }

  const closeOutreachDrawer = () => {
    setShowOutreachDrawer(false)
    setSelectedJob(null)
    setOutreachDraft('')
  }

  useEffect(() => {
    if (showOutreachDrawer) return
    if (!routeParams?.job && !routeParams?.jobId) return

    const targetJob =
      routeParams.job ||
      outreachJobs.find(job => job.id === routeParams.jobId) ||
      null

    if (targetJob) {
      openOutreachDrawer(targetJob)
    }

    navigation.setParams?.({ job: undefined, jobId: undefined })
  }, [routeParams, outreachJobs, showOutreachDrawer, navigation])

  const handleGenerateOutreachDraft = () => {
    if (!selectedJob) return
    if (!canAffordOutreach) {
      Alert.alert('Not enough credits', `Generating outreach drafts requires ${outreachCost} credits.`)
      return
    }

    const spent = spendCredits('outreachMessageGen', `Outreach draft for ${selectedJob.company}`)
    if (!spent) {
      Alert.alert('Not enough credits', `Generating outreach drafts requires ${outreachCost} credits.`)
      return
    }

    setOutreachDraft(buildOutreachDraft(selectedJob))
  }

  const handleCopyOutreachDraft = async () => {
    if (!outreachDraft.trim()) {
      Alert.alert('No draft yet', 'Generate a draft first before copying.')
      return
    }
    await Clipboard.setStringAsync(outreachDraft)
    Alert.alert('Copied', 'Outreach draft copied to clipboard.')
  }

  const handleMarkOutreachSent = () => {
    if (!selectedJob) return

    if (outreachDraft.trim()) {
      const previousNotes = selectedJob.notes?.trim() || ''
      const updatedNotes = [
        previousNotes,
        `[Outreach sent • ${new Date().toLocaleDateString()}]`,
        outreachDraft.trim(),
      ]
        .filter(Boolean)
        .join('\n\n')

      updateJobNotes(selectedJob.id, updatedNotes)
    }

    Alert.alert('Marked as sent', 'Outreach was logged for this role.')
    closeOutreachDrawer()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='arrow-back-ios' size={18} color={CLTheme.text.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Outreach Center</Text>
          <Text style={styles.headerSubtitle}>Job-specific follow-up queue</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{outreachJobs.length}</Text>
              <Text style={styles.summaryText}>To do</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{pendingJobs}</Text>
              <Text style={styles.summaryText}>Pending</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{sentThisWeek}</Text>
              <Text style={styles.summaryText}>Sent</Text>
            </View>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionLabel}>Needs Attention</Text>
          {outreachJobs.length === 0 ? (
            <Text style={styles.emptyText}>No follow-up actions yet. Add jobs in Job Tracker first.</Text>
          ) : (
            outreachJobs.map(job => {
              const isSent = Boolean(job.notes?.includes(OUTREACH_SENT_PREFIX))
              return (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobRow}
                  onPress={() => openOutreachDrawer(job)}
                  activeOpacity={0.85}
                  accessibilityLabel={`Open outreach drawer for ${job.role} at ${job.company}`}
                >
                  <View style={styles.jobRowLeft}>
                    <Text style={styles.jobRole}>{job.role}</Text>
                    <Text style={styles.jobCompany}>{job.company}</Text>
                    <Text style={styles.jobMeta}>
                      {job.nextAction} • {job.nextActionDate}
                    </Text>
                  </View>
                  <View style={styles.jobRowRight}>
                    <View style={[styles.statusBadge, isSent ? styles.statusSent : styles.statusPending]}>
                      <Text style={[styles.statusText, isSent ? styles.statusSentText : styles.statusPendingText]}>
                        {isSent ? 'SENT' : 'PENDING'}
                      </Text>
                    </View>
                    <Feather name='chevron-right' size={18} color={CLTheme.text.muted} />
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={showOutreachDrawer} animationType='slide' transparent>
        <View style={styles.outreachOverlay}>
          <TouchableOpacity style={styles.outreachBackdrop} activeOpacity={1} onPress={closeOutreachDrawer} />
          <View style={styles.outreachSheet}>
            <View style={styles.outreachHandle} />
            <View style={styles.outreachHeaderRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.outreachTitle}>Draft Outreach Message</Text>
                <Text style={styles.outreachSubtitle}>
                  {selectedJob?.role} • {selectedJob?.company}
                </Text>
                <Text style={styles.outreachMeta}>
                  {selectedJob?.nextAction || 'Follow-up email / test'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeOutreachDrawer} style={styles.iconButton}>
                <Feather name='x' size={22} color={CLTheme.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.creditCostRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name='zap' size={14} color={creditColor} />
                <Text style={styles.creditBalanceSmall}>{creditBalance} credits</Text>
              </View>
              <Text style={styles.creditEstimate}>Generate: ~{outreachCost} credits</Text>
            </View>

            <View style={styles.outreachEditorCard}>
              <Text style={styles.outreachEditorLabel}>Message Preview</Text>
              <TextInput
                style={styles.outreachTextarea}
                value={outreachDraft}
                onChangeText={setOutreachDraft}
                multiline
                textAlignVertical='top'
                placeholder='Generate an AI follow-up message, then edit before copying.'
                placeholderTextColor={CLTheme.text.muted}
              />
            </View>

            <View style={styles.outreachActionRow}>
              <TouchableOpacity
                style={[styles.outreachGenerateBtn, !canAffordOutreach && { opacity: 0.45 }]}
                onPress={handleGenerateOutreachDraft}
                disabled={!canAffordOutreach}
                testID='outreach-center-generate'
              >
                <Feather name='zap' size={16} color='#fff' />
                <Text style={styles.outreachGenerateBtnText}>Generate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outreachCopyBtn}
                onPress={handleCopyOutreachDraft}
                testID='outreach-center-copy'
              >
                <Feather name='copy' size={16} color={CLTheme.accent} />
                <Text style={styles.outreachCopyBtnText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outreachMarkSentBtn}
                onPress={handleMarkOutreachSent}
                testID='outreach-center-mark-sent'
              >
                <Feather name='check-circle' size={18} color='#fff' />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 12,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CLTheme.card,
    borderWidth: 1,
    borderColor: CLTheme.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: CLTheme.text.secondary,
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryStat: {
    flex: 1,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  summaryText: {
    marginTop: 2,
    fontSize: 11,
    color: CLTheme.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  listCard: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    borderRadius: 14,
    padding: 14,
  },
  emptyText: {
    fontSize: 13,
    color: CLTheme.text.secondary,
    lineHeight: 19,
  },
  jobRow: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 12,
    backgroundColor: CLTheme.background,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  jobRowLeft: {
    flex: 1,
  },
  jobRowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  jobRole: {
    fontSize: 14,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  jobCompany: {
    marginTop: 2,
    fontSize: 12,
    color: CLTheme.text.secondary,
  },
  jobMeta: {
    marginTop: 4,
    fontSize: 11,
    color: CLTheme.text.muted,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPending: {
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusSent: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusPendingText: {
    color: '#f59e0b',
  },
  statusSentText: {
    color: '#10b981',
  },
  outreachOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  outreachBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  outreachSheet: {
    backgroundColor: CLTheme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: CLTheme.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
  },
  outreachHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: CLTheme.border,
    alignSelf: 'center',
    marginBottom: 2,
  },
  outreachHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  outreachTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  outreachSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: CLTheme.accent,
    fontWeight: '600',
  },
  outreachMeta: {
    marginTop: 2,
    fontSize: 11,
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  creditCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
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
  outreachEditorCard: {
    backgroundColor: CLTheme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outreachEditorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: CLTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  outreachTextarea: {
    color: CLTheme.text.primary,
    minHeight: 140,
    fontSize: 14,
    lineHeight: 21,
  },
  outreachActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outreachGenerateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: CLTheme.accent,
    borderRadius: 12,
    paddingVertical: 13,
  },
  outreachGenerateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  outreachCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.35)',
    borderRadius: 12,
    paddingVertical: 13,
  },
  outreachCopyBtnText: {
    color: CLTheme.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  outreachMarkSentBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
