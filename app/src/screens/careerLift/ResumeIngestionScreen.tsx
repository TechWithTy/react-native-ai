import { useCallback, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as DocumentPicker from 'expo-document-picker'
import { useCareerSetupStore } from '../../store/careerSetup'

export function ResumeIngestionScreen({ navigation }: any) {
  const selectedFile = useCareerSetupStore(state => state.sourceResumeName)
  const setCareerSetup = useCareerSetupStore(state => state.setCareerSetup)
  const [showLinkedInAuth, setShowLinkedInAuth] = useState(false)
  const [linkedInAuthorized, setLinkedInAuthorized] = useState(false)

  const canProceed = !!selectedFile

  const pickResume = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        multiple: false,
      })
      if (!result.canceled && result.assets?.length) {
        setCareerSetup({ sourceResumeName: result.assets[0].name })
      }
    } catch {
      Alert.alert('Upload failed', 'Could not open file picker.')
    }
  }, [setCareerSetup])

  const startLinkedInAuth = () => {
    setLinkedInAuthorized(false)
    setShowLinkedInAuth(true)
  }

  const authorizeLinkedIn = () => {
    setLinkedInAuthorized(true)
    setCareerSetup({ sourceResumeName: 'LinkedIn_Imported_Profile.pdf' })
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topSpacer} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.9}>
          <MaterialIcons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <View style={styles.stepDots}>
            <View style={[styles.stepDot, styles.stepDotDone]} />
            <View style={[styles.stepDot, styles.stepDotDone]} />
            <View style={[styles.stepDot, styles.stepDotDone]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Lets get your baseline.</Text>
          <Text style={styles.subtitle}>
            Upload your current resume. We will use this as your <Text style={styles.highlight}>Source Resume</Text>{' '}
            for tailoring.
          </Text>
        </View>

        <TouchableOpacity onPress={pickResume} style={styles.uploadZone} activeOpacity={0.9}>
          <View style={styles.uploadIconWrap}>
            <MaterialIcons name='cloud-upload' size={38} color='#0d6cf2' />
          </View>
          <Text style={styles.uploadTitle}>{selectedFile ? 'Change Resume' : 'Tap to browse files'}</Text>
          <Text style={styles.uploadSub}>PDF, DOCX, or TXT up to 5MB</Text>
          {selectedFile ? (
            <View style={styles.selectedFileIndicator}>
               <MaterialIcons name="description" size={16} color="#60a5fa" />
               <Text style={styles.uploadSelected}>{selectedFile}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        {!selectedFile ? (
          <Text style={styles.validationText}>Upload or import a resume to continue.</Text>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or import via</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={startLinkedInAuth} style={styles.linkedInBtn} activeOpacity={0.9}>
          <Text style={styles.linkedInBtnText}>{linkedInAuthorized ? 'LinkedIn Profile Connected' : 'Import from LinkedIn'}</Text>
        </TouchableOpacity>

        <View style={styles.securityBadge}>
          <MaterialIcons name='lock' size={14} color='#10b981' />
          <Text style={styles.securityText}>Encrypted and Private</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => {
            if (canProceed) navigation.navigate('MainTabs')
          }} 
          style={[
            styles.cta,
            !canProceed && { opacity: 0.5, backgroundColor: '#334155' }
          ]} 
          disabled={!canProceed}
          activeOpacity={0.9}
        >
          <Text style={[styles.ctaText, !canProceed && { color: '#94a3b8' }]}>Complete Setup</Text>
        </TouchableOpacity>
        {!canProceed ? (
          <Text style={styles.validationDockText}>A source resume is required to complete setup.</Text>
        ) : null}
        {!selectedFile && (
          <TouchableOpacity
            onPress={() => {
                Alert.alert('AI Generation', 'This will start an AI chat to generate your resume profile.', [
                    { 
                      text: 'Start AI Chat', 
                      onPress: () => {
                        setCareerSetup({ sourceResumeName: 'AI_Generated_Resume.pdf' })
                      } 
                    },
                    { text: 'Cancel', style: 'cancel' }
                ])
            }}
            style={styles.secondaryBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryBtnText}>No resume? Generate with AI</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showLinkedInAuth}
        transparent
        animationType='fade'
        onRequestClose={() => setShowLinkedInAuth(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LinkedIn Authorization</Text>
            <Text style={styles.modalSub}>
              {linkedInAuthorized
                ? 'LinkedIn connected. We imported your baseline profile.'
                : 'Authorize Career Lift to import your LinkedIn profile as your source resume.'}
            </Text>
            <View style={styles.modalActions}>
              {!linkedInAuthorized ? (
                <>
                  <TouchableOpacity
                    onPress={() => setShowLinkedInAuth(false)}
                    style={styles.modalSecondary}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={authorizeLinkedIn} style={styles.modalPrimary} activeOpacity={0.9}>
                    <Text style={styles.modalPrimaryText}>Authorize LinkedIn</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setShowLinkedInAuth(false)
                    navigation.navigate('MainTabs')
                  }}
                  style={styles.modalPrimary}
                  activeOpacity={0.9}
                >
                  <Text style={styles.modalPrimaryText}>Use Imported Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101722',
  },
  topSpacer: {
    height: 44,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18212f',
  },
  stepWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stepLabel: {
    color: '#60a5fa',
    fontSize: 11,
    letterSpacing: 0.7,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  stepDotDone: {
    backgroundColor: '#0d6cf2',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  textBlock: {
    marginBottom: 18,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
  },
  highlight: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  uploadZone: {
    minHeight: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#334155',
    backgroundColor: '#18212f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  uploadIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    marginBottom: 14,
  },
  uploadTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  uploadSelected: {
    marginTop: 4,
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedFileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  validationText: {
    marginTop: 10,
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#243244',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  linkedInBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#18212f',
    paddingVertical: 13,
    alignItems: 'center',
  },
  linkedInBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  securityBadge: {
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#243244',
    backgroundColor: '#18212f',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  securityText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#243244',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#101722',
  },
  cta: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0d6cf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  validationDockText: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.7)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#243244',
    backgroundColor: '#101722',
    padding: 16,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  modalSecondary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#18212f',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 12,
  },
  modalPrimary: {
    borderRadius: 10,
    backgroundColor: '#0d6cf2',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
})
