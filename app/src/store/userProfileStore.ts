import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CustomInterviewPrepPayload, CustomInterviewPrepRecord } from '../../types'

export type ProfileNextAction = {
  id: string
  title: string
  tag: string
  isCompleted: boolean
  isDueToday?: boolean
  muted?: boolean
}

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
  currentLocation: string
  isOpenToWork: boolean
  linkedInConnected: boolean
  bio: string
  nextActions: ProfileNextAction[]
  customInterviewPreps: CustomInterviewPrepRecord[]
  linkedInKitWins: {
    topSkills: boolean
    openToWork: boolean
    banner: boolean
  }
}

interface UserProfileStore extends UserProfile {
  setProfile: (updates: Partial<UserProfile>) => void
  toggleNextAction: (id: string) => void
  saveCustomInterviewPrep: (prep: CustomInterviewPrepPayload) => void
  setLinkedInKitWins: (wins: UserProfile['linkedInKitWins']) => void
  resetProfile: () => void
}

const defaultProfile: UserProfile = {
  name: 'Alex Mercer', // Default placeholder
  email: 'alex.mercer@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=alex',
  currentLocation: 'San Francisco, CA',
  isOpenToWork: true,
  linkedInConnected: false,
  bio: 'Senior Product Manager with a passion for user-centric design.',
  nextActions: [
    { id: '1', title: 'Follow up with Acme Corp', tag: 'Due Today', isCompleted: false, isDueToday: true },
    { id: '2', title: 'Review Apply Pack for Google', tag: 'Tomorrow', isCompleted: false },
    { id: '3', title: 'Update LinkedIn Headline', tag: 'General', isCompleted: false, muted: true },
  ],
  customInterviewPreps: [],
  linkedInKitWins: {
    topSkills: true,
    openToWork: false,
    banner: false,
  },
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

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set) => ({
      ...defaultProfile,
      setProfile: (updates) => set((state) => ({ ...state, ...updates })),
      toggleNextAction: (id) =>
        set((state) => ({
          ...state,
          nextActions: state.nextActions.map((item) =>
            item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
          ),
        })),
      setLinkedInKitWins: (wins) => set((state) => ({ ...state, linkedInKitWins: wins })),
      saveCustomInterviewPrep: (prep) =>
        set((state) => {
          const key = `${prep.inferredRole}::${prep.companyName ?? ''}`
          const deduped = state.customInterviewPreps.filter(
            item => `${item.inferredRole}::${item.companyName ?? ''}` !== key
          )

          const savedPrep: CustomInterviewPrepRecord = {
            ...prep,
            id: `custom-prep-${Date.now()}`,
            savedAt: new Date().toISOString(),
          }

          return {
            ...state,
            customInterviewPreps: [savedPrep, ...deduped],
          }
        }),
      resetProfile: () => set(defaultProfile),
    }),
    {
      name: 'rnai-user-profile-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)
