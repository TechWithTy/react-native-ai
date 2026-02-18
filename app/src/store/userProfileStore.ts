import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CustomInterviewPrepPayload, CustomInterviewPrepRecord } from '../../types'

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
  currentLocation: string
  isOpenToWork: boolean
  bio: string
  customInterviewPreps: CustomInterviewPrepRecord[]
}

interface UserProfileStore extends UserProfile {
  setProfile: (updates: Partial<UserProfile>) => void
  saveCustomInterviewPrep: (prep: CustomInterviewPrepPayload) => void
  resetProfile: () => void
}

const defaultProfile: UserProfile = {
  name: 'Alex Mercer', // Default placeholder
  email: 'alex.mercer@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=alex',
  currentLocation: 'San Francisco, CA',
  isOpenToWork: true,
  bio: 'Senior Product Manager with a passion for user-centric design.',
  customInterviewPreps: [],
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
