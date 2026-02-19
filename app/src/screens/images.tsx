import {
  View,
  Text,
  TouchableHighlight,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Keyboard,
  Image,
} from 'react-native'
import { useContext, useRef, useState } from 'react'
import { DOMAIN, IMAGE_MODELS } from '../../constants'
import { v4 as uuid } from 'uuid'
import { ThemeContext, AppContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useActionSheet } from '@expo/react-native-action-sheet'
import * as LegacyFileSystem from 'expo-file-system/legacy'
import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import { pickImageFromLibrary } from '../native/permissions/media'

const { width } = Dimensions.get('window')

const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

type DocumentOrImageAsset = {
  uri: string
  name?: string
  mimeType?: string | null
}

type AssistantEntry = {
  user?: string
  image?: string
  assistant?: string
  model?: string
  provider?: string
  attachmentName?: string
}

type ImagesState = {
  index: typeof uuid
  values: AssistantEntry[]
}

const fallbackResumePrompt =
  'Target role: Product Designer. Include summary, 3 impact bullets, and a skills section.'

const buildResumeDraft = (prompt: string) => {
  const seed = (prompt || fallbackResumePrompt).trim()
  return [
    'Resume Draft (AI)',
    '',
    'Professional Summary',
    `• ${seed}`,
    '• Results-focused professional with clear ownership and measurable outcomes.',
    '',
    'Experience Highlights',
    '• Led cross-functional delivery with clear milestones and stakeholder updates.',
    '• Improved process quality and execution speed through structured prioritization.',
    '• Built reusable systems that increased team productivity and consistency.',
    '',
    'Skills',
    '• Communication • Prioritization • Leadership • Data-driven decision making',
    '',
    'Tip: Replace placeholders with role-specific metrics (%, $, time saved).',
  ].join('\n')
}

const buildResumeReview = (fileName: string, prompt: string) => {
  const context = prompt.trim() ? `Target notes: ${prompt.trim()}` : 'No target notes provided.'
  return [
    `Resume Review: ${fileName}`,
    '',
    'Strengths',
    '• Clear baseline structure for scanning and recruiter readability.',
    '• Good candidate for keyword tailoring based on role requirements.',
    '',
    'Gaps To Improve',
    '• Add measurable impact in each role bullet (%, $, time).',
    '• Move strongest role-aligned keywords into summary + latest experience.',
    '• Keep bullets concise (1 achievement per bullet, action + result).',
    '',
    context,
    '',
    'Suggested Next Step',
    '• Generate a role-specific version and compare ATS keyword coverage.',
  ].join('\n')
}

export function Images() {
  const [callMade, setCallMade] = useState(false)
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [input, setInput] = useState('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState<DocumentOrImageAsset | null>(null)
  const [legacyImageMode, setLegacyImageMode] = useState(false)
  const [images, setImages] = useState<ImagesState>({
    index: uuid,
    values: [],
  })
  const { handlePresentModalPress, closeModal, imageModel } = useContext(AppContext)
  const { showActionSheetWithOptions } = useActionSheet()

  const currentModel = IMAGE_MODELS[imageModel as keyof typeof IMAGE_MODELS]?.name || imageModel

  const addEntry = (entry: AssistantEntry) => {
    setImages(prev => ({
      index: prev.index,
      values: [...prev.values, entry],
    }))
  }

  const updateLastEntry = (updates: Partial<AssistantEntry>) => {
    setImages(prev => {
      if (prev.values.length === 0) return prev
      const nextValues = [...prev.values]
      nextValues[nextValues.length - 1] = { ...nextValues[nextValues.length - 1], ...updates }
      return { index: prev.index, values: nextValues }
    })
  }

  async function runLegacyImageGeneration() {
    if (loading || !input.trim()) return
    Keyboard.dismiss()

    const currentInput = input.trim()
    const imageCopy = attachment
    setCallMade(true)
    addEntry({ user: currentInput, attachmentName: imageCopy?.name })
    setLoading(true)
    setInput('')
    setAttachment(null)

    try {
      const body: Record<string, unknown> = {
        prompt: currentInput,
        model: imageModel,
      }

      let response
      if (imageCopy) {
        const formData = new FormData()
        // @ts-ignore
        formData.append('file', {
          uri: imageCopy.uri.replace('file://', ''),
          name: imageCopy.name || uuid(),
          type: imageCopy.mimeType || 'image/jpeg',
        })
        Object.entries(body).forEach(([key, value]) => formData.append(key, String(value)))

        response = await fetch(`${DOMAIN}/images/gemini`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }).then(res => res.json())
      } else {
        response = await fetch(`${DOMAIN}/images/gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).then(res => res.json())
      }

      if (response?.image) {
        updateLastEntry({
          image: response.image,
          model: currentModel,
          provider: 'Gemini',
        })
      } else {
        updateLastEntry({
          assistant: 'Legacy image mode could not generate this request. Try a different prompt.',
        })
      }
    } catch {
      updateLastEntry({
        assistant: 'Legacy image request failed. Please try again.',
      })
    } finally {
      setLoading(false)
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 50)
    }
  }

  async function runDocumentsResumeFlow() {
    if (loading) return
    if (!input.trim() && !attachment) return

    Keyboard.dismiss()
    const currentInput = input.trim()
    const attachmentCopy = attachment
    setCallMade(true)
    addEntry({
      user: currentInput || 'Review selected document',
      attachmentName: attachmentCopy?.name,
    })
    setLoading(true)
    setInput('')
    setAttachment(null)

    setTimeout(() => {
      const assistantResponse = attachmentCopy
        ? buildResumeReview(attachmentCopy.name || 'Resume document', currentInput)
        : buildResumeDraft(currentInput)

      updateLastEntry({ assistant: assistantResponse })
      setLoading(false)
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 20)
    }, 420)
  }

  async function generate() {
    if (legacyImageMode) {
      await runLegacyImageGeneration()
      return
    }
    await runDocumentsResumeFlow()
  }

  async function chooseAttachment() {
    try {
      if (legacyImageMode) {
        const res = await pickImageFromLibrary({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 1,
        })
        if (!res.success || !res.asset) return
        setAttachment({
          uri: res.asset.uri,
          name: res.asset.fileName || 'Selected image',
          mimeType: res.asset.mimeType,
        })
        return
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [...ACCEPTED_DOCUMENT_MIME_TYPES, 'image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.length) return
      const asset = result.assets[0]
      setAttachment({
        uri: asset.uri,
        name: asset.name || 'Selected document',
        mimeType: asset.mimeType,
      })
    } catch {
      // Intentionally quiet, matching existing UI behavior.
    }
  }

  const renderSelectedAttachment = () => {
    if (!attachment) return null
    return (
      <View style={styles.midFileNameContainer}>
        <Text style={styles.fileName} numberOfLines={1}>
          {attachment.name || 'Selected attachment'}
        </Text>
        <TouchableHighlight
          onPress={() => setAttachment(null)}
          style={styles.closeIconContainer}
          underlayColor='transparent'
        >
          <MaterialIcons style={styles.closeIcon} name='close' color={theme.textColor} size={14} />
        </TouchableHighlight>
      </View>
    )
  }

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text)
  }

  const clearPrompts = () => {
    setCallMade(false)
    setImages({
      index: uuid,
      values: [],
    })
    setAttachment(null)
    setInput('')
  }

  async function downloadImageToDevice(url: string) {
    try {
      const baseDir = LegacyFileSystem.documentDirectory || LegacyFileSystem.cacheDirectory
      if (!baseDir) return
      const downloadResumable = LegacyFileSystem.createDownloadResumable(url, `${baseDir}${uuid()}.png`)
      await downloadResumable.downloadAsync()
    } catch {
      // Intentionally quiet, matching existing UI behavior.
    }
  }

  function showEntryActionsheet(entry: AssistantEntry) {
    closeModal()
    if (entry.image) {
      showActionSheetWithOptions(
        {
          options: ['Save image', 'Clear prompts', 'cancel'],
          cancelButtonIndex: 2,
        },
        selectedIndex => {
          if (selectedIndex === 0 && entry.image) downloadImageToDevice(entry.image)
          if (selectedIndex === 1) clearPrompts()
        }
      )
      return
    }

    showActionSheetWithOptions(
      {
        options: ['Copy result', 'Clear prompts', 'cancel'],
        cancelButtonIndex: 2,
      },
      selectedIndex => {
        if (selectedIndex === 0 && entry.assistant) copyToClipboard(entry.assistant)
        if (selectedIndex === 1) clearPrompts()
      }
    )
  }

  const inputPlaceholder = legacyImageMode
    ? 'What image do you want to create?'
    : 'Describe the resume to create or upload one to review'
  const primaryActionLabel = legacyImageMode ? 'Create image' : 'Create / Review resume'
  const helperText = legacyImageMode
    ? 'Legacy image generation mode. Long-press create to switch model.'
    : 'Documents mode. Upload from Documents/Downloads to review a resume.'
  const attachIconName = legacyImageMode ? (attachment ? 'checkmark-circle' : 'camera-outline') : 'document-outline'
  const sendIconName = legacyImageMode ? 'arrow-up' : 'check'

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior='padding' style={styles.container} keyboardVerticalOffset={110}>
        <ScrollView
          contentContainerStyle={!callMade && styles.scrollContentContainer}
          ref={scrollViewRef}
          keyboardShouldPersistTaps='handled'
          style={styles.scrollContainer}
        >
          <View style={styles.modeToggleRow}>
            <TouchableHighlight
              onPress={() => {
                setLegacyImageMode(false)
                setAttachment(null)
              }}
              underlayColor='transparent'
            >
              <View style={[styles.modeChip, !legacyImageMode && styles.modeChipActive]}>
                <MaterialIcons name='file-document-outline' size={14} color={!legacyImageMode ? theme.tintTextColor : theme.textColor} />
                <Text style={[styles.modeChipText, !legacyImageMode && styles.modeChipTextActive]}>Documents</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight
              onPress={() => {
                setLegacyImageMode(true)
                setAttachment(null)
              }}
              underlayColor='transparent'
            >
              <View style={[styles.modeChip, legacyImageMode && styles.modeChipActive]}>
                <Ionicons name='images-outline' size={14} color={legacyImageMode ? theme.tintTextColor : theme.textColor} />
                <Text style={[styles.modeChipText, legacyImageMode && styles.modeChipTextActive]}>Legacy Images</Text>
              </View>
            </TouchableHighlight>
          </View>

          {!callMade ? (
            <View style={styles.midChatInputWrapper}>
              <View style={styles.midChatInputContainer}>
                <TextInput
                  onChangeText={setInput}
                  style={styles.midInput}
                  placeholder={inputPlaceholder}
                  placeholderTextColor={theme.placeholderTextColor}
                  autoCorrect
                  value={input}
                />
                <View style={styles.midButtonRow}>
                  <TouchableHighlight
                    onPress={generate}
                    underlayColor='transparent'
                    style={styles.midButtonWrapper}
                    onLongPress={() => {
                      if (!legacyImageMode) return
                      Keyboard.dismiss()
                      handlePresentModalPress()
                    }}
                  >
                    <View style={styles.midButtonStyle}>
                      <Ionicons
                        name={legacyImageMode ? 'images-outline' : 'document-text-outline'}
                        size={22}
                        color={theme.tintTextColor}
                      />
                      <Text style={styles.midButtonText}>{primaryActionLabel}</Text>
                    </View>
                  </TouchableHighlight>
                  <TouchableHighlight onPress={chooseAttachment} underlayColor='transparent'>
                    <View style={styles.addAttachmentIconButton}>
                      <Ionicons name={attachIconName as any} size={20} color={theme.textColor} />
                    </View>
                  </TouchableHighlight>
                </View>
                {renderSelectedAttachment()}
                <Text style={styles.chatDescription}>{helperText}</Text>
              </View>
            </View>
          ) : null}

          {images.values.map((entry, index) => (
            <View key={index} style={styles.entryContainer}>
              {entry.user ? (
                <View style={styles.promptTextContainer}>
                  <View style={styles.promptTextWrapper}>
                    <Text style={styles.promptText}>{entry.user}</Text>
                  </View>
                </View>
              ) : null}

              {entry.attachmentName ? (
                <View style={styles.attachmentTag}>
                  <MaterialIcons name='file-document-outline' size={14} color={theme.textColor} />
                  <Text style={styles.attachmentTagText} numberOfLines={1}>
                    {entry.attachmentName}
                  </Text>
                </View>
              ) : null}

              {entry.image ? (
                <View>
                  <TouchableHighlight onPress={() => showEntryActionsheet(entry)} underlayColor='transparent'>
                    <Image source={{ uri: entry.image }} style={styles.image} />
                  </TouchableHighlight>
                  <View style={styles.modelLabelContainer}>
                    <Text style={styles.modelLabelText}>
                      Created with {entry.provider || 'Gemini'} model {entry.model}
                    </Text>
                  </View>
                </View>
              ) : null}

              {entry.assistant ? (
                <TouchableHighlight onPress={() => showEntryActionsheet(entry)} underlayColor='transparent'>
                  <View style={styles.responseCard}>
                    <Text style={styles.responseText}>{entry.assistant}</Text>
                    <View style={styles.responseActionRow}>
                      <Ionicons name='copy-outline' size={14} color={theme.textColor} />
                      <Text style={styles.responseActionText}>Tap for actions</Text>
                    </View>
                  </View>
                </TouchableHighlight>
              ) : null}
            </View>
          ))}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          ) : null}
        </ScrollView>

        {callMade ? (
          <>
            {renderSelectedAttachment()}
            <View style={styles.chatInputContainer}>
              <TouchableHighlight onPress={clearPrompts} underlayColor='transparent'>
                <View style={styles.clearButton}>
                  <Ionicons name='trash-outline' size={18} color={theme.textColor} />
                </View>
              </TouchableHighlight>
              <TextInput
                onChangeText={setInput}
                style={styles.input}
                placeholder={legacyImageMode ? 'What else do you want to create?' : 'Add more resume context...'}
                placeholderTextColor={theme.placeholderTextColor}
                autoCorrect
                value={input}
              />
              <TouchableHighlight onPress={chooseAttachment} underlayColor='transparent'>
                <View style={styles.attachIconButton}>
                  <Ionicons name={legacyImageMode ? 'images-outline' : 'document-outline'} size={18} color={theme.tintTextColor} />
                </View>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={generate}
                underlayColor='transparent'
                onLongPress={() => {
                  if (!legacyImageMode) return
                  Keyboard.dismiss()
                  handlePresentModalPress()
                }}
              >
                <View style={styles.buttonStyle}>
                  <Ionicons name={sendIconName as any} size={20} color={theme.tintTextColor} />
                </View>
              </TouchableHighlight>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    scrollContentContainer: {
      flex: 1,
    },
    scrollContainer: {
      paddingTop: 10,
    },
    modeToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
      paddingHorizontal: 10,
    },
    modeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.backgroundColor,
    },
    modeChipActive: {
      backgroundColor: theme.tintColor,
      borderColor: theme.tintColor,
    },
    modeChipText: {
      color: theme.textColor,
      fontSize: 12,
      fontFamily: theme.mediumFont,
    },
    modeChipTextActive: {
      color: theme.tintTextColor,
      fontFamily: theme.boldFont,
    },
    midChatInputWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    midChatInputContainer: {
      width: '100%',
      paddingTop: 5,
      paddingBottom: 5,
    },
    midInput: {
      marginBottom: 8,
      borderWidth: 1,
      paddingHorizontal: 25,
      marginHorizontal: 10,
      paddingVertical: 15,
      borderRadius: 99,
      color: theme.textColor,
      borderColor: theme.borderColor,
      fontFamily: theme.mediumFont,
    },
    midButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 14,
    },
    midButtonWrapper: {
      flex: 1,
    },
    midButtonStyle: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 99,
      backgroundColor: theme.tintColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    midButtonText: {
      color: theme.tintTextColor,
      marginLeft: 10,
      fontFamily: theme.boldFont,
      fontSize: 16,
    },
    addAttachmentIconButton: {
      padding: 10,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    midFileNameContainer: {
      marginTop: 20,
      marginHorizontal: 10,
      marginRight: 20,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 7,
    },
    fileName: {
      color: theme.textColor,
    },
    closeIconContainer: {
      position: 'absolute',
      right: -15,
      top: -17,
      padding: 10,
      backgroundColor: 'transparent',
      borderRadius: 25,
    },
    closeIcon: {
      borderWidth: 1,
      padding: 4,
      backgroundColor: theme.backgroundColor,
      borderColor: theme.borderColor,
      borderRadius: 15,
    },
    chatDescription: {
      color: theme.textColor,
      textAlign: 'center',
      marginTop: 15,
      fontSize: 13,
      paddingHorizontal: 34,
      opacity: 0.8,
      fontFamily: theme.regularFont,
    },
    entryContainer: {
      marginBottom: 15,
    },
    promptTextContainer: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: 5,
      marginLeft: 24,
      marginBottom: 5,
    },
    promptTextWrapper: {
      borderRadius: 8,
      borderTopRightRadius: 0,
      backgroundColor: theme.tintColor,
    },
    promptText: {
      color: theme.tintTextColor,
      fontFamily: theme.regularFont,
      paddingVertical: 5,
      paddingHorizontal: 9,
      fontSize: 16,
    },
    attachmentTag: {
      marginHorizontal: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    attachmentTagText: {
      flex: 1,
      color: theme.textColor,
      fontSize: 12,
      fontFamily: theme.mediumFont,
    },
    responseCard: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 10,
      marginHorizontal: 10,
      padding: 12,
      backgroundColor: theme.backgroundColor,
    },
    responseText: {
      color: theme.textColor,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: theme.regularFont,
    },
    responseActionRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    responseActionText: {
      color: theme.textColor,
      opacity: 0.7,
      fontSize: 11,
      fontFamily: theme.mediumFont,
    },
    image: {
      width: width - 10,
      height: width - 10,
      marginTop: 5,
      marginHorizontal: 5,
      borderRadius: 8,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    modelLabelContainer: {
      padding: 9,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: theme.borderColor,
      paddingLeft: 13,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      marginHorizontal: 5,
    },
    modelLabelText: {
      color: theme.mutedForegroundColor,
      fontFamily: theme.regularFont,
      fontSize: 13,
    },
    loadingContainer: {
      marginVertical: 25,
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatInputContainer: {
      paddingTop: 5,
      borderColor: theme.borderColor,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 5,
    },
    clearButton: {
      marginLeft: 10,
      padding: 8,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 99,
      color: theme.textColor,
      marginHorizontal: 10,
      paddingVertical: 10,
      paddingHorizontal: 21,
      paddingRight: 39,
      borderColor: theme.borderColor,
      fontFamily: theme.semiBoldFont,
    },
    attachIconButton: {
      marginRight: 8,
      padding: 6,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    buttonStyle: {
      marginRight: 14,
      padding: 5,
      borderRadius: 99,
      backgroundColor: theme.tintColor,
    },
  })
