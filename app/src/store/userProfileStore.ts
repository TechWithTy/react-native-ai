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

export type NotificationChannel = 'email' | 'sms' | 'push'
export type NotificationPreferenceKey =
  | 'newScanReady'
  | 'applicationStatus'
  | 'savedJobFilters'
  | 'interviewReminders'
  | 'followUpAlerts'
  | 'weeklyDigest'
  | 'securityAlerts'

export type NotificationChannelPreferences = Record<NotificationChannel, boolean>
export type CareerDocumentType = 'resume' | 'coverLetter'
export type CareerDocumentStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

export type CareerDocument = {
  id: string
  name: string
  type: CareerDocumentType
  uri: string
  mimeType: string | null
  targetLabel: string | null
  track: string | null
  status: CareerDocumentStatus
  conversionRate: number
  createdAt: string
  updatedAt: string
}

export type CareerDocumentInput = Omit<CareerDocument, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

interface UserProfile {
  name: string
  email: string
  avatarUrl: string | null
  currentLocation: string
  isOpenToWork: boolean
  linkedInConnected: boolean
  bio: string
  faceIdAuthEnabled: boolean
  twoFactorAuth: {
    enabled: boolean
    method: 'sms' | 'authenticator' | null
    phoneNumber: string | null
  }
  notificationPhoneNumber: string
  notificationPhoneVerified: boolean
  pauseAllNotifications: boolean
  notificationPreferences: Record<NotificationPreferenceKey, NotificationChannelPreferences>
  careerDocuments: CareerDocument[]
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
  setNotificationChannel: (
    key: NotificationPreferenceKey,
    channel: NotificationChannel,
    value: boolean
  ) => void
  addCareerDocument: (document: CareerDocumentInput) => void
  updateCareerDocument: (id: string, updates: Partial<Omit<CareerDocument, 'id' | 'createdAt'>>) => void
  removeCareerDocument: (id: string) => void
  setPauseAllNotifications: (paused: boolean) => void
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
  faceIdAuthEnabled: false,
  twoFactorAuth: {
    enabled: false,
    method: null,
    phoneNumber: null,
  },
  notificationPhoneNumber: '+1 (555) 012-3456',
  notificationPhoneVerified: true,
  pauseAllNotifications: false,
  notificationPreferences: {
    newScanReady: { email: true, sms: false, push: true },
    applicationStatus: { email: true, sms: true, push: true },
    savedJobFilters: { email: true, sms: false, push: true },
    interviewReminders: { email: true, sms: true, push: true },
    followUpAlerts: { email: false, sms: true, push: true },
    weeklyDigest: { email: true, sms: false, push: true },
    securityAlerts: { email: true, sms: true, push: true },
  },
  careerDocuments: [],
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
      setNotificationChannel: (key, channel, value) =>
        set((state) => ({
          ...state,
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: {
              ...state.notificationPreferences[key],
              [channel]: value,
            },
          },
        })),
      addCareerDocument: (document) =>
        set((state) => {
          const now = new Date().toISOString()
          const normalizedType: CareerDocumentType = document.type === 'coverLetter' ? 'coverLetter' : 'resume'
          const deduped = state.careerDocuments.filter(
            item => !(item.name === document.name && item.type === normalizedType)
          )

          const nextDocument: CareerDocument = {
            id: document.id ?? `doc-${Date.now()}`,
            name: document.name,
            type: normalizedType,
            uri: document.uri,
            mimeType: document.mimeType ?? null,
            targetLabel: document.targetLabel ?? null,
            track: document.track ?? null,
            status: document.status,
            conversionRate: document.conversionRate,
            createdAt: now,
            updatedAt: now,
          }

          return {
            ...state,
            careerDocuments: [nextDocument, ...deduped],
          }
        }),
      updateCareerDocument: (id, updates) =>
        set((state) => ({
          ...state,
          careerDocuments: state.careerDocuments.map(item =>
            item.id === id
              ? {
                  ...item,
                  ...updates,
                  id: item.id,
                  createdAt: item.createdAt,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        })),
      removeCareerDocument: (id) =>
        set((state) => ({
          ...state,
          careerDocuments: state.careerDocuments.filter(item => item.id !== id),
        })),
      setPauseAllNotifications: (paused) => set((state) => ({ ...state, pauseAllNotifications: paused })),
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
