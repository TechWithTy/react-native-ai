import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard
} from 'react-native'
import 'react-native-get-random-values'
import { useContext, useEffect, useMemo, useState, useRef } from 'react'
import { ThemeContext, AppContext } from '../context'
import { getEventSource, getFirstNCharsOrLess, getChatType } from '../utils'
import { v4 as uuid } from 'uuid'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Clipboard from 'expo-clipboard'
import { useActionSheet } from '@expo/react-native-action-sheet'
import Markdown from '@ronradtke/react-native-markdown-display'
import { useNavigation } from '@react-navigation/native'
import { useAIAgentsStore } from '../store/aiAgentsStore'
import { MODELS } from '../../constants'

type ChatState = {
  messages: Array<{user: string, assistant?: string}>,
  index: string,
  apiMessages: string
}

const createEmptyChatState = (): ChatState => ({
  messages: [],
  index: uuid(),
  apiMessages: ''
})

export function Chat() {
  const navigation = useNavigation<any>()
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const { showActionSheetWithOptions } = useActionSheet()

  // Per-model chat state - each model has its own conversation history
  const [chatStates, setChatStates] = useState<Record<string, ChatState>>({})

  // Helper to get or create chat state for current model
  const getChatState = (modelLabel: string): ChatState => {
    return chatStates[modelLabel] || createEmptyChatState()
  }

  // Helper to update chat state for a specific model
  const updateChatState = (modelLabel: string, updater: (prev: ChatState) => ChatState) => {
    setChatStates(prev => ({
      ...prev,
      [modelLabel]: updater(prev[modelLabel] || createEmptyChatState())
    }))
  }

  const { theme } = useContext(ThemeContext)
  const { chatType } = useContext(AppContext)
  const agents = useAIAgentsStore(state => state.agents)
  const selectedAgentId = useAIAgentsStore(state => state.selectedAgentId)
  const setSelectedAgent = useAIAgentsStore(state => state.setSelectedAgent)
  const selectedModelLabel = useAIAgentsStore(state => state.selectedModelLabel)
  const setSelectedModelLabel = useAIAgentsStore(state => state.setSelectedModelLabel)
  const instructionBadges = useAIAgentsStore(state => state.instructionBadges)
  const removeInstructionBadge = useAIAgentsStore(state => state.removeInstructionBadge)
  const voiceModeEnabled = useAIAgentsStore(state => state.voiceModeEnabled)
  const setVoiceModeEnabled = useAIAgentsStore(state => state.setVoiceModeEnabled)
  const styles = getStyles(theme)
  const activeAgent = useMemo(
    () => agents.find(agent => agent.id === selectedAgentId) || agents[0],
    [agents, selectedAgentId]
  )
  const activePrompt = activeAgent?.prompt?.trim() || ''
  const selectedModelName = useMemo(() => {
    const match = Object.values(MODELS).find(model => model.label === selectedModelLabel)
    return match?.name || selectedModelLabel
  }, [selectedModelLabel])
  const resolvedSystemPrompt = useMemo(() => {
    const additiveInstructions = instructionBadges.length
      ? `Additional user instructions:\n${instructionBadges.map((badge, index) => `${index + 1}. ${badge}`).join('\n')}`
      : ''
    return [activePrompt, additiveInstructions].filter(Boolean).join('\n\n')
  }, [activePrompt, instructionBadges])

  useEffect(() => {
    setSelectedModelLabel(chatType.label)
  }, [chatType.label, setSelectedModelLabel])

  const getVoicePracticeQuestion = () => {
    if (selectedAgentId === 'interview_coach') {
      return 'Tell me about a time you influenced a key decision without direct authority.'
    }
    if (selectedAgentId === 'resume_reviewer') {
      return 'Walk me through your strongest resume bullet and explain the measurable business impact.'
    }
    if (selectedAgentId === 'networking_coach') {
      return 'How would you open a short networking conversation with a hiring manager you have never met?'
    }
    return 'Tell me about a recent career win and why it mattered.'
  }

  function startVoicePracticeCall() {
    navigation.navigate('MockInterview', {
      category: 'AI Practice Call',
      question: getVoicePracticeQuestion(),
    })
  }

  async function chat() {
    if (voiceModeEnabled) {
      startVoicePracticeCall()
      return
    }
    if (!input) return
    Keyboard.dismiss()
    if (chatType.label.includes('claude')) {
      generateClaudeResponse()
    } else if (chatType.label.includes('gpt')) {
      generateGptResponse()
    } else if (chatType.label.includes('gemini')) {
      generateGeminiResponse()
    }
  }
  async function generateGptResponse() {
    if (!input) return
    Keyboard.dismiss()
    let localResponse = ''
    const modelLabel = chatType.label
    const currentState = getChatState(modelLabel)

    let messageArray = [
      ...currentState.messages, {
        user: input,
      }
    ] as [{user: string, assistant?: string}]

    updateChatState(modelLabel, prev => ({
      ...prev,
      messages: JSON.parse(JSON.stringify(messageArray))
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true
      })
    }, 1)
    setInput('')

    const messages = messageArray.reduce((acc: any[], message) => {
      acc.push({ role: 'user', content: message.user })
      if (message.assistant) {
        acc.push({ role: 'assistant', content: message.assistant })
      }
      return acc
    }, [])
    const messagesWithPrompt = resolvedSystemPrompt
      ? [{ role: 'system', content: resolvedSystemPrompt }, ...messages]
      : messages

    const eventSourceArgs = {
      body: {
        messages: messagesWithPrompt,
        model: chatType.label
      },
      type: getChatType(chatType)
    }

    const es = await getEventSource(eventSourceArgs)

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.")
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true
            })
          }
          const data = JSON.parse(event.data)
          if (typeof data === 'string') {
            localResponse = localResponse + data
          } else if (data?.content) {
            localResponse = localResponse + data.content
          }
          messageArray[messageArray.length - 1].assistant = localResponse
          updateChatState(modelLabel, prev => ({
            ...prev,
            messages: JSON.parse(JSON.stringify(messageArray))
          }))
        } else {
          setLoading(false)
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }

    es.addEventListener("open", listener)
    es.addEventListener("message", listener)
    es.addEventListener("error", listener)
  }
  async function generateGeminiResponse() {
    if (!input) return
    Keyboard.dismiss()
    let localResponse = ''
    const modelLabel = chatType.label
    const currentState = getChatState(modelLabel)
    const geminiInput = resolvedSystemPrompt
      ? `${resolvedSystemPrompt}\n\nUser prompt:\n${input}`
      : `${input}`

    let messageArray = [
      ...currentState.messages, {
        user: input,
      }
    ] as [{user: string, assistant?: string}]

    updateChatState(modelLabel, prev => ({
      ...prev,
      messages: JSON.parse(JSON.stringify(messageArray))
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true
      })
    }, 1)
    setInput('')

    const eventSourceArgs = {
      body: {
        prompt: geminiInput,
        model: chatType.label
      },
      type: getChatType(chatType)
    }

    const es = await getEventSource(eventSourceArgs)

   
    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.")
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true
            })
          }
        
          const data = event.data
          localResponse = localResponse + JSON.parse(data)
          messageArray[messageArray.length - 1].assistant = localResponse
          updateChatState(modelLabel, prev => ({
            ...prev,
            messages: JSON.parse(JSON.stringify(messageArray))
          }))
        } else {
          setLoading(false)
          updateChatState(modelLabel, prev => ({
            ...prev,
            apiMessages: `${prev.apiMessages}\n\nPrompt: ${input}\n\nResponse:${localResponse}`
          }))
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }
   
    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  }

  async function generateClaudeResponse() {
    if (!input) return
    Keyboard.dismiss()
    let localResponse = ''
    const modelLabel = chatType.label
    const currentState = getChatState(modelLabel)
    const claudeInput = `${resolvedSystemPrompt ? `System: ${resolvedSystemPrompt}\n\n` : ''}${currentState.apiMessages}\n\nHuman: ${input}\n\nAssistant:`

    let messageArray = [
      ...currentState.messages, {
        user: input,
      }
    ] as [{user: string, assistant?: string}]

    updateChatState(modelLabel, prev => ({
      ...prev,
      messages: JSON.parse(JSON.stringify(messageArray))
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true
      })
    }, 1)
    setInput('')

    const eventSourceArgs = {
      body: {
        prompt: claudeInput,
        model: chatType.label
      },
      type: getChatType(chatType),
    }

    const es = await getEventSource(eventSourceArgs)

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.")
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true
            })
          }
          const data = event.data
          localResponse = localResponse + JSON.parse(data).text
          messageArray[messageArray.length - 1].assistant = localResponse
          updateChatState(modelLabel, prev => ({
            ...prev,
            messages: JSON.parse(JSON.stringify(messageArray))
          }))
        } else {
          setLoading(false)
          updateChatState(modelLabel, prev => ({
            ...prev,
            apiMessages: `${prev.apiMessages}\n\nHuman: ${input}\n\nAssistant:${getFirstNCharsOrLess(localResponse, 2000)}`
          }))
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }
    es.addEventListener("open", listener)
    es.addEventListener("message", listener)
    es.addEventListener("error", listener)
  }

  async function copyToClipboard(text) {
    await Clipboard.setStringAsync(text)
  }

  async function showClipboardActionsheet(text) {
    const cancelButtonIndex = 2
    showActionSheetWithOptions({
      options: ['Copy to clipboard', 'Clear chat', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === Number(0)) {
        copyToClipboard(text)
      }
      if (selectedIndex === 1) {
        clearChat()
      }
    })
  }

  async function clearChat() {
    if (loading) return
    const modelLabel = chatType.label
    updateChatState(modelLabel, () => createEmptyChatState())
  }

  function renderItem({
    item, index
  } : {
    item: any, index: number
  }) {
    return (
      <View style={styles.promptResponse} key={index}>
        <View style={styles.promptTextContainer}>
          <View style={styles.promptTextWrapper}>
            <Text style={styles.promptText}>
              {item.user}
            </Text>
          </View>
        </View>
      {
        item.assistant && (
          <View style={styles.textStyleContainer}>
            <Markdown
              style={styles.markdownStyle as any}
            >{item.assistant}</Markdown>
            <TouchableHighlight
              onPress={() => showClipboardActionsheet(item.assistant)}
              underlayColor={'transparent'}
            >
              <View style={styles.optionsIconWrapper}>
                <Ionicons
                  name="apps"
                  size={20}
                  color={theme.textColor}
                />
              </View>
            </TouchableHighlight>
          </View>
        )
      }
      </View>
    )
  }

  const currentChatState = getChatState(chatType.label)
  const callMade = currentChatState.messages.length > 0

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        ref={scrollViewRef}
        contentContainerStyle={!callMade && styles.scrollContentContainer}
      >
        <View style={styles.agentPanel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agentChipScroll}
          >
            {agents.map(agent => {
              const selected = selectedAgentId === agent.id
              return (
                <TouchableHighlight
                  key={agent.id}
                  onPress={() => setSelectedAgent(agent.id)}
                  underlayColor='transparent'
                >
                  <View style={[styles.agentChip, selected && styles.agentChipActive]}>
                    <Text style={[styles.agentChipText, selected && styles.agentChipTextActive]}>
                      {agent.label}
                    </Text>
                  </View>
                </TouchableHighlight>
              )
            })}
          </ScrollView>
          <View style={styles.modeSwitchRow}>
            <Text style={styles.modeContextText}>
              {activeAgent?.description || 'Selected assistant preset is active.'}
            </Text>
            <TouchableHighlight
              onPress={() => setVoiceModeEnabled(!voiceModeEnabled)}
              underlayColor='transparent'
            >
              <View style={styles.modeToggleBtn}>
                <Ionicons
                  name={voiceModeEnabled ? 'mic-outline' : 'chatbox-ellipses-outline'}
                  size={16}
                  color={theme.tintTextColor}
                />
                <Text style={styles.modeToggleText}>{voiceModeEnabled ? 'Voice' : 'Text'}</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={styles.metaBadgeRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{`Model: ${selectedModelName}`}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{`Prompt: ${activeAgent?.label || 'General'}`}</Text>
            </View>
            {instructionBadges.map(badge => (
              <TouchableHighlight
                key={badge}
                onPress={() => removeInstructionBadge(badge)}
                underlayColor='transparent'
              >
                <View style={styles.userInstructionBadge}>
                  <Text style={styles.userInstructionBadgeText} numberOfLines={1}>
                    {badge}
                  </Text>
                  <Ionicons name='close' size={12} color={theme.tintTextColor} />
                </View>
              </TouchableHighlight>
            ))}
          </View>
        </View>
        {
          !callMade && (
            <View style={styles.midChatInputWrapper}>
              <View style={styles.midChatInputContainer}>
                
                <TextInput
                  onChangeText={v => setInput(v)}
                  style={styles.midInput}
                  placeholder='Message'
                  placeholderTextColor={theme.placeholderTextColor}
                  autoCorrect={true}
                  value={input}
                />
                <TouchableHighlight
                  onPress={voiceModeEnabled ? startVoicePracticeCall : chat}
                  underlayColor={'transparent'}
                >
                  <View style={styles.midButtonStyle}>
                    <Ionicons
                      name={voiceModeEnabled ? 'call-outline' : 'chatbox-ellipses-outline'}
                      size={22} color={theme.tintTextColor}
                    />
                    <Text style={styles.midButtonText}>
                      {voiceModeEnabled ? 'Start voice practice' : 'Start chat'}
                    </Text>
                  </View>
                </TouchableHighlight>
                <Text style={styles.chatDescription}>
                  {voiceModeEnabled
                    ? 'Voice mode is enabled. Start an AI practice call with the selected agent.'
                    : 'Chat with a variety of different language models using the selected agent prompt.'}
                </Text>
              </View>
            </View>
          )
        }
        {
          callMade && (
            <FlatList
              data={currentChatState.messages}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )
        }
        {
          loading && (
            <ActivityIndicator style={styles.loadingContainer} />
          )
        }
      </ScrollView>
      {
        callMade && (
          <View
              style={styles.chatInputContainer}
            >
            <TouchableHighlight
              underlayColor={'transparent'}
              activeOpacity={0.75}
              onPress={() => setVoiceModeEnabled(!voiceModeEnabled)}
            >
              <View style={styles.modeIconButton}>
                <Ionicons
                  name={voiceModeEnabled ? 'mic-outline' : 'chatbox-ellipses-outline'}
                  size={18}
                  color={theme.textColor}
                />
              </View>
            </TouchableHighlight>
            <TextInput
              style={styles.input}
              onChangeText={v => setInput(v)}
              placeholder='Message'
              placeholderTextColor={theme.placeholderTextColor}
              value={input}
            />
            <TouchableHighlight
              underlayColor={'transparent'}
              activeOpacity={0.65}
              onPress={voiceModeEnabled ? startVoicePracticeCall : chat}
            >
              <View
                style={styles.chatButton}
              >
                <Ionicons
                  name={voiceModeEnabled ? 'call-outline' : 'arrow-up-outline'}
                  size={20} color={theme.tintTextColor}
                />
              </View>
            </TouchableHighlight>
          </View>
        )
      }
    </KeyboardAvoidingView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  agentPanel: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  agentChipScroll: {
    gap: 8,
    paddingRight: 10,
  },
  agentChip: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    backgroundColor: theme.backgroundColor,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
  agentChipActive: {
    backgroundColor: theme.tintColor,
    borderColor: theme.tintColor,
  },
  agentChipText: {
    color: theme.textColor,
    fontSize: 12,
    fontFamily: theme.mediumFont,
  },
  agentChipTextActive: {
    color: theme.tintTextColor,
    fontFamily: theme.boldFont,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  modeContextText: {
    flex: 1,
    color: theme.textColor,
    opacity: 0.72,
    fontSize: 11,
    fontFamily: theme.regularFont,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: theme.tintColor,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeToggleText: {
    color: theme.tintTextColor,
    fontSize: 11,
    fontFamily: theme.boldFont,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaBadge: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.backgroundColor,
  },
  metaBadgeText: {
    color: theme.textColor,
    fontSize: 11,
    fontFamily: theme.mediumFont,
  },
  userInstructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: theme.tintColor,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 220,
  },
  userInstructionBadgeText: {
    color: theme.tintTextColor,
    fontSize: 11,
    fontFamily: theme.mediumFont,
  },
  optionsIconWrapper: {
    padding: 10,
    paddingTop: 9,
    alignItems: 'flex-end'
  },
  scrollContentContainer: {
    flex: 1,
  },
  chatDescription: {
    color: theme.textColor,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
    paddingHorizontal: 34,
    opacity: .8,
    fontFamily: theme.regularFont
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
  midButtonStyle: {
    flexDirection: 'row',
    marginHorizontal: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
    justifyContent: 'center',
    alignItems: 'center'
  },
  midButtonText: {
    color: theme.tintTextColor,
    marginLeft: 10,
    fontFamily: theme.boldFont,
    fontSize: 16
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midChatInputContainer: {
    width: '100%',
    paddingTop: 5,
    paddingBottom: 5
  },
  loadingContainer: {
    marginTop: 25
  },
  promptResponse: {
    marginTop: 10,
  },
  textStyleContainer: {
    borderWidth: 1,
    marginRight: 25,
    borderColor: theme.borderColor,
    padding: 15,
    paddingBottom: 6,
    paddingTop: 5,
    margin: 10,
    borderRadius: 13
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 15,
    marginLeft: 24,
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
    fontSize: 16
  },
  chatButton: {
    marginRight: 14,
    padding: 5,
    borderRadius: 99,
    backgroundColor: theme.tintColor
  },
  modeIconButton: {
    marginLeft: 10,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 99,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundColor,
  },
  chatInputContainer: {
    paddingTop: 5,
    borderColor: theme.borderColor,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5
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
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
  markdownStyle: {
    body: {
      color: theme.textColor,
      fontFamily: theme.regularFont
    },
    paragraph: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    heading1: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginVertical: 5
    },
    heading2: {
      marginTop: 20,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginBottom: 5
    },
    heading3: {
      marginTop: 20,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading4: {
      marginTop: 10,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading5: {
      marginTop: 10,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading6: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginVertical: 5
    },
    list_item: {
      marginTop: 7,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: 16,
    },
    ordered_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    bullet_list: {
      marginTop: 10
    },
    ordered_list: {
      marginTop: 7
    },
    bullet_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    code_inline: {
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.lightFont
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, .1)',
      height: 1,
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.regularFont
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: 'rgba(255, 255, 255, .2)',
      flexDirection: 'row',
    },
    table: {
      marginTop: 7,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .2)',
      borderRadius: 3,
    },
    blockquote: {
      backgroundColor: '#312e2e',
      borderColor: '#CCC',
      borderLeftWidth: 4,
      marginLeft: 5,
      paddingHorizontal: 5,
      marginVertical: 5,
    },
  } as any,
})
