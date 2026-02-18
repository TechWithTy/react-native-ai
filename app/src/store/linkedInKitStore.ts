import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type LinkedInToneMode = 'Concise' | 'Technical'
export type LinkedInSectionTab = 'Headline' | 'About Me' | 'Experience' | 'Skills'
export type LinkedInSourceType = 'resume' | 'linkedin'

export interface LinkedInKitSession {
  id: string
  sourceType: LinkedInSourceType
  sourceLabel: string
  resumeName: string | null
  tone: LinkedInToneMode
  activeTab: LinkedInSectionTab
  optimizedSummary: string
  creditsUsed: number
  createdAt: string
}

type CreateLinkedInKitSessionInput = Omit<LinkedInKitSession, 'id' | 'createdAt'>

interface LinkedInKitState {
  activeSession: LinkedInKitSession | null
  history: LinkedInKitSession[]
  createSession: (input: CreateLinkedInKitSessionInput) => LinkedInKitSession
  updateSession: (updates: Partial<Omit<LinkedInKitSession, 'id' | 'createdAt'>>) => void
  clearSession: () => void
  resetLinkedInKit: () => void
}

const defaultState = {
  activeSession: null as LinkedInKitSession | null,
  history: [] as LinkedInKitSession[],
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

export const useLinkedInKitStore = create<LinkedInKitState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      createSession: (input) => {
        const session: LinkedInKitSession = {
          ...input,
          id: `likit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        }
        set(state => ({
          activeSession: session,
          history: [session, ...state.history].slice(0, 12),
        }))
        return session
      },
      updateSession: (updates) => {
        const { activeSession } = get()
        if (!activeSession) return
        const nextSession: LinkedInKitSession = {
          ...activeSession,
          ...updates,
        }
        set(state => ({
          activeSession: nextSession,
          history: [nextSession, ...state.history.filter(item => item.id !== nextSession.id)].slice(0, 12),
        }))
      },
      clearSession: () => set({ activeSession: null }),
      resetLinkedInKit: () => set(defaultState),
    }),
    {
      name: 'rnai-linkedin-kit-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)
