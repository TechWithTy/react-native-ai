import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { CustomInterviewPrepPayload } from '../../../../types'
import { getRoleOptionsForTrack, useCareerSetupStore } from '../../../store/careerSetup'
import { CLTheme } from '../theme'
import { ModalContainer } from './modalContainer'

type CustomPrepEntryModalProps = {
  visible: boolean
  onClose: () => void
  onSubmit: (prep: CustomInterviewPrepPayload) => void
}

const normalizeSpace = (value: string) => value.replace(/\s+/g, ' ').trim()

const inferCompanyName = (source: string, mode: 'url' | 'text') => {
  if (mode === 'url') {
    try {
      const host = new URL(source).hostname.replace('www.', '')
      const [namePart] = host.split('.')
      if (!namePart) return null
      return namePart.charAt(0).toUpperCase() + namePart.slice(1)
    } catch {
      return null
    }
  }

  const companyMatch = source.match(/(?:company|about)\s*:?\s*([A-Z][A-Za-z0-9 &.-]{2,40})/i)
  return companyMatch?.[1]?.trim() ?? null
}

const inferFocusAreas = (source: string, inferredRole: string) => {
  const normalized = source.toLowerCase()
  const inferred: string[] = []

  if (normalized.includes('stakeholder') || normalized.includes('cross-functional')) {
    inferred.push('Stakeholder Management')
  }
  if (normalized.includes('data') || normalized.includes('analytics') || normalized.includes('sql')) {
    inferred.push('Data-Driven Decisions')
  }
  if (normalized.includes('roadmap') || normalized.includes('strategy')) {
    inferred.push('Product Strategy')
  }
  if (normalized.includes('lead') || normalized.includes('ownership')) {
    inferred.push('Leadership')
  }
  if (normalized.includes('customer') || normalized.includes('user research')) {
    inferred.push('Customer Empathy')
  }

  if (inferred.length === 0) {
    inferred.push(`${inferredRole} Fundamentals`, 'Behavioral STAR Stories', 'Role-Specific Tradeoffs')
  }

  return inferred.slice(0, 4)
}

export function CustomPrepEntryModal({ visible, onClose, onSubmit }: CustomPrepEntryModalProps) {
  const { roleTrack, targetRole, setCareerSetup } = useCareerSetupStore()
  const [jobInputMode, setJobInputMode] = useState<'url' | 'text'>('url')
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')

  const roleOptions = getRoleOptionsForTrack(roleTrack || 'Engineering')

  const inferTargetRole = (source: string) => {
    const normalized = source.toLowerCase().replace(/[-_/]/g, ' ')

    const exactMatch = roleOptions.find(option => normalized.includes(option.toLowerCase()))
    if (exactMatch) return exactMatch

    const partialMatch = roleOptions.find(option => {
      const [firstWord] = option.toLowerCase().split(' ')
      return firstWord.length > 2 && normalized.includes(firstWord)
    })
    if (partialMatch) return partialMatch

    return targetRole || roleOptions[0] || 'Software Engineer'
  }

  const reset = () => {
    setJobInputMode('url')
    setJobDescriptionUrl('')
    setJobDescriptionText('')
  }

  const handleClose = () => {
    onClose()
    reset()
  }

  const handleSubmit = () => {
    const source = normalizeSpace(jobInputMode === 'url' ? jobDescriptionUrl : jobDescriptionText)
    if (!source) {
      Alert.alert('Missing Input', 'Paste a job description URL or job description text to continue.')
      return
    }

    if (jobInputMode === 'url' && !/^https?:\/\/\S+$/i.test(source)) {
      Alert.alert('Invalid URL', 'Enter a valid job description URL that starts with http:// or https://.')
      return
    }

    const inferredRole = inferTargetRole(source)
    const prepPayload: CustomInterviewPrepPayload = {
      inferredRole,
      roleTrack: roleTrack || 'Engineering',
      companyName: inferCompanyName(source, jobInputMode),
      sourceType: jobInputMode,
      sourcePreview: source.slice(0, 180),
      focusAreas: inferFocusAreas(source, inferredRole),
      generatedAt: new Date().toISOString(),
    }

    setCareerSetup({ targetRole: inferredRole })
    onSubmit(prepPayload)
    reset()
  }

  return (
    <ModalContainer visible={visible} onClose={handleClose} animationType='fade'>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Custom Interview Prep</Text>
          <TouchableOpacity onPress={handleClose} accessibilityLabel='Close custom prep modal'>
            <MaterialIcons name='close' size={22} color={CLTheme.text.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalSubtitle}>
          Add a job URL or paste the job description to build a custom prep flow.
        </Text>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, jobInputMode === 'url' && styles.modeTabActive]}
            onPress={() => setJobInputMode('url')}
          >
            <Text style={[styles.modeTabText, jobInputMode === 'url' && styles.modeTabTextActive]}>URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, jobInputMode === 'text' && styles.modeTabActive]}
            onPress={() => setJobInputMode('text')}
          >
            <Text style={[styles.modeTabText, jobInputMode === 'text' && styles.modeTabTextActive]}>Paste JD</Text>
          </TouchableOpacity>
        </View>

        {jobInputMode === 'url' ? (
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Job URL</Text>
            <TextInput
              style={styles.textInput}
              value={jobDescriptionUrl}
              onChangeText={setJobDescriptionUrl}
              placeholder='https://company.com/jobs/senior-pm'
              placeholderTextColor={CLTheme.text.muted}
              autoCapitalize='none'
              autoCorrect={false}
            />
          </View>
        ) : (
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Job Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={jobDescriptionText}
              onChangeText={setJobDescriptionText}
              placeholder='Paste the full job description text here'
              placeholderTextColor={CLTheme.text.muted}
              multiline
              textAlignVertical='top'
            />
          </View>
        )}

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalContainer>
  )
}

const styles = StyleSheet.create({
  modalCard: {
    backgroundColor: CLTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CLTheme.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: CLTheme.text.secondary,
    marginBottom: 14,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: CLTheme.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
  },
  modeTabActive: {
    backgroundColor: 'rgba(13, 108, 242, 0.2)',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  modeTabTextActive: {
    color: CLTheme.accent,
  },
  inputBlock: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CLTheme.text.muted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: CLTheme.background,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    color: CLTheme.text.primary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CLTheme.text.secondary,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: CLTheme.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
})
