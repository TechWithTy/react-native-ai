import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
  currentLocation: string
  isOpenToWork: boolean
  bio: string
}

interface UserProfileStore extends UserProfile {
  setProfile: (updates: Partial<UserProfile>) => void
  resetProfile: () => void
}

const defaultProfile: UserProfile = {
  name: 'Alex Mercer', // Default placeholder
  email: 'alex.mercer@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=alex',
  currentLocation: 'San Francisco, CA',
  isOpenToWork: true,
  bio: 'Senior Product Manager with a passion for user-centric design.',
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
      resetProfile: () => set(defaultProfile),
    }),
    {
      name: 'rnai-user-profile-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)
