import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { MODELS } from '../../constants'

export type AIAgentId = 'general_coach' | 'interview_coach' | 'resume_reviewer' | 'networking_coach'

export type AIAgentPromptConfig = {
  id: AIAgentId
  label: string
  description: string
  prompt: string
}

type AIAgentsState = {
  agents: AIAgentPromptConfig[]
  selectedAgentId: AIAgentId
  selectedModelLabel: string
  instructionBadges: string[]
  voiceModeEnabled: boolean
  setSelectedAgent: (id: AIAgentId) => void
  setSelectedModelLabel: (label: string) => void
  addInstructionBadge: (value: string) => void
  removeInstructionBadge: (value: string) => void
  clearInstructionBadges: () => void
  setVoiceModeEnabled: (enabled: boolean) => void
  toggleVoiceMode: () => void
  updateAgentPrompt: (id: AIAgentId, prompt: string) => void
  getAgentById: (id: AIAgentId) => AIAgentPromptConfig | undefined
  getActivePrompt: () => string
  resetAIAgents: () => void
}

const MAX_INSTRUCTION_BADGES = 8
const MAX_INSTRUCTION_BADGE_LENGTH = 80

function normalizeInstructionBadge(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_INSTRUCTION_BADGE_LENGTH)
}

const defaultAgents: AIAgentPromptConfig[] = [
  {
    id: 'general_coach',
    label: 'General',
    description: 'General career coaching and clear action steps.',
    prompt:
      'You are Career Lift AI Coach. Give concise, practical career guidance with clear next steps and measurable outcomes.',
  },
  {
    id: 'interview_coach',
    label: 'Interview',
    description: 'Mock interview framing and feedback loops.',
    prompt:
      'You are an interview coach. Ask high-signal follow-up questions, evaluate answers with STAR structure, and suggest improvements.',
  },
  {
    id: 'resume_reviewer',
    label: 'Resume',
    description: 'Resume and application-document optimization.',
    prompt:
      'You are a resume reviewer. Improve clarity, impact, and ATS alignment. Suggest quantified bullet rewrites and keyword coverage.',
  },
  {
    id: 'networking_coach',
    label: 'Outreach',
    description: 'Networking and follow-up messaging.',
    prompt:
      'You are a networking coach. Draft concise, professional outreach and follow-up messages with strong personalization cues.',
  },
]

const defaultState = {
  agents: defaultAgents,
  selectedAgentId: 'general_coach' as AIAgentId,
  selectedModelLabel: MODELS.claudeOpus.label,
  instructionBadges: [],
  voiceModeEnabled: false,
}

const memoryState: Record<string, string> = {}
const memoryStorage = {
  getItem: async (name: string) => memoryState[name] ?? null,
  setItem: async (name: string, value: string) => {
    memoryState[name] = value
  },
  removeItem: async (name: string) => {
    delete memoryState[name]
  },
}

const isTest = typeof process !== 'undefined' && typeof process.env?.JEST_WORKER_ID !== 'undefined'
const getPersistStorage = () => {
  if (isTest) return memoryStorage
  return require('@react-native-async-storage/async-storage').default
}

export const useAIAgentsStore = create<AIAgentsState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setSelectedAgent: id => set({ selectedAgentId: id }),
      setSelectedModelLabel: label => set({ selectedModelLabel: label }),
      addInstructionBadge: value =>
        set(state => {
          const nextBadge = normalizeInstructionBadge(value)
          if (!nextBadge) return state
          if (
            state.instructionBadges.some(existing => existing.toLowerCase() === nextBadge.toLowerCase())
          ) {
            return state
          }

          return {
            instructionBadges: [nextBadge, ...state.instructionBadges].slice(0, MAX_INSTRUCTION_BADGES),
          }
        }),
      removeInstructionBadge: value =>
        set(state => ({
          instructionBadges: state.instructionBadges.filter(
            existing => existing.toLowerCase() !== value.toLowerCase()
          ),
        })),
      clearInstructionBadges: () => set({ instructionBadges: [] }),
      setVoiceModeEnabled: enabled => set({ voiceModeEnabled: enabled }),
      toggleVoiceMode: () => set(state => ({ voiceModeEnabled: !state.voiceModeEnabled })),
      updateAgentPrompt: (id, prompt) =>
        set(state => ({
          agents: state.agents.map(agent => (agent.id === id ? { ...agent, prompt: prompt.trim() } : agent)),
        })),
      getAgentById: id => get().agents.find(agent => agent.id === id),
      getActivePrompt: () => {
        const { agents, selectedAgentId } = get()
        return agents.find(agent => agent.id === selectedAgentId)?.prompt ?? ''
      },
      resetAIAgents: () => set(defaultState),
    }),
    {
      name: 'rnai-ai-agents-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)
