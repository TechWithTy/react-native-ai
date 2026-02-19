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

export type DocumentInsights = {
  totalDocuments: number
  totalResumes: number
  totalCoverLetters: number
  interviewRate: number
  offerRate: number
  averageConversionRate: number
  topPerformingDocumentId: string | null
  byStatus: Record<CareerDocumentStatus, number>
  updatedAt: string
}

export type ActivityLogEventType =
  | 'document_upload'
  | 'document_update'
  | 'document_remove'
  | 'security_update'
  | 'data_export'
  | 'profile_update'
  | 'system'

export type ActivityLogEntry = {
  id: string
  timestamp: string
  eventType: ActivityLogEventType
  source: 'settings' | 'documents' | 'account_security' | 'system'
  title: string
  description: string
}

export type ActivityLogEntryInput = Omit<ActivityLogEntry, 'id' | 'timestamp'> & {
  id?: string
  timestamp?: string
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
  documentInsights: DocumentInsights
  activityLog: ActivityLogEntry[]
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
  addActivityLogEntry: (entry: ActivityLogEntryInput) => void
  markActivityLogExported: (source?: ActivityLogEntry['source']) => void
  setPauseAllNotifications: (paused: boolean) => void
  toggleNextAction: (id: string) => void
  saveCustomInterviewPrep: (prep: CustomInterviewPrepPayload) => void
  setLinkedInKitWins: (wins: UserProfile['linkedInKitWins']) => void
  resetProfile: () => void
}

const MAX_ACTIVITY_LOG_ENTRIES = 250

function toIsoFromDaysAgo(daysAgo: number, hoursAgo = 0) {
  const now = new Date()
  now.setDate(now.getDate() - daysAgo)
  now.setHours(now.getHours() - hoursAgo)
  return now.toISOString()
}

function calculateDocumentInsights(careerDocuments: CareerDocument[]): DocumentInsights {
  const totalDocuments = careerDocuments.length
  const byStatus: Record<CareerDocumentStatus, number> = {
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  }

  let totalResumes = 0
  let totalCoverLetters = 0
  let conversionSum = 0
  let topPerformingDocumentId: string | null = null
  let topConversionRate = -1

  for (const document of careerDocuments) {
    byStatus[document.status] += 1
    if (document.type === 'resume') totalResumes += 1
    if (document.type === 'coverLetter') totalCoverLetters += 1
    conversionSum += document.conversionRate

    if (document.conversionRate > topConversionRate) {
      topConversionRate = document.conversionRate
      topPerformingDocumentId = document.id
    }
  }

  const interviewCount = byStatus.interviewing + byStatus.offer
  const offerCount = byStatus.offer

  return {
    totalDocuments,
    totalResumes,
    totalCoverLetters,
    interviewRate: totalDocuments ? Number((interviewCount / totalDocuments).toFixed(2)) : 0,
    offerRate: totalDocuments ? Number((offerCount / totalDocuments).toFixed(2)) : 0,
    averageConversionRate: totalDocuments ? Number((conversionSum / totalDocuments).toFixed(2)) : 0,
    topPerformingDocumentId,
    byStatus,
    updatedAt: new Date().toISOString(),
  }
}

function createActivityLogEntry(entry: ActivityLogEntryInput): ActivityLogEntry {
  return {
    id: entry.id ?? `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    eventType: entry.eventType,
    source: entry.source,
    title: entry.title,
    description: entry.description,
  }
}

function prependActivityLogEntry(activityLog: ActivityLogEntry[], entry: ActivityLogEntryInput) {
  return [createActivityLogEntry(entry), ...activityLog].slice(0, MAX_ACTIVITY_LOG_ENTRIES)
}

const defaultCareerDocuments: CareerDocument[] = [
  {
    id: 'doc-mock-1',
    name: 'Resume v4 - Tech Lead.pdf',
    type: 'resume',
    uri: 'file:///mock/documents/resume-v4-tech-lead.pdf',
    mimeType: 'application/pdf',
    targetLabel: 'Senior SWE @ Google',
    track: 'Engineering',
    status: 'interviewing',
    conversionRate: 0.15,
    createdAt: toIsoFromDaysAgo(8),
    updatedAt: toIsoFromDaysAgo(2),
  },
  {
    id: 'doc-mock-2',
    name: 'Cover Letter - Startups.docx',
    type: 'coverLetter',
    uri: 'file:///mock/documents/cover-letter-startups.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    targetLabel: 'Founding Eng @ OpenAI',
    track: 'Engineering',
    status: 'applied',
    conversionRate: 0.05,
    createdAt: toIsoFromDaysAgo(13),
    updatedAt: toIsoFromDaysAgo(7),
  },
  {
    id: 'doc-mock-3',
    name: 'Resume v3 - Backend.pdf',
    type: 'resume',
    uri: 'file:///mock/documents/resume-v3-backend.pdf',
    mimeType: 'application/pdf',
    targetLabel: 'Staff Eng @ Netflix',
    track: 'Engineering',
    status: 'offer',
    conversionRate: 1,
    createdAt: toIsoFromDaysAgo(21),
    updatedAt: toIsoFromDaysAgo(14),
  },
  {
    id: 'doc-mock-4',
    name: 'Resume 2023 - Legacy.pdf',
    type: 'resume',
    uri: 'file:///mock/documents/resume-2023-legacy.pdf',
    mimeType: 'application/pdf',
    targetLabel: 'Product Manager @ Meta',
    track: 'Product',
    status: 'rejected',
    conversionRate: 0,
    createdAt: toIsoFromDaysAgo(45),
    updatedAt: toIsoFromDaysAgo(32),
  },
]

const defaultActivityLog: ActivityLogEntry[] = [
  {
    id: 'activity-seed-1',
    timestamp: toIsoFromDaysAgo(2, 2),
    eventType: 'document_update',
    source: 'documents',
    title: 'Document status changed',
    description: 'Resume v4 - Tech Lead.pdf moved to Interviewing.',
  },
  {
    id: 'activity-seed-2',
    timestamp: toIsoFromDaysAgo(3, 3),
    eventType: 'security_update',
    source: 'account_security',
    title: 'Two-factor authentication enabled',
    description: 'Authenticator app verification is active for login.',
  },
  {
    id: 'activity-seed-3',
    timestamp: toIsoFromDaysAgo(5, 6),
    eventType: 'document_upload',
    source: 'documents',
    title: 'Cover letter uploaded',
    description: 'Cover Letter - Startups.docx was added to your library.',
  },
  {
    id: 'activity-seed-4',
    timestamp: toIsoFromDaysAgo(8, 5),
    eventType: 'profile_update',
    source: 'settings',
    title: 'Profile preferences updated',
    description: 'Target role and salary preferences were adjusted.',
  },
]

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
  careerDocuments: defaultCareerDocuments,
  documentInsights: calculateDocumentInsights(defaultCareerDocuments),
  activityLog: defaultActivityLog,
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

          const nextCareerDocuments = [nextDocument, ...deduped]

          return {
            ...state,
            careerDocuments: nextCareerDocuments,
            documentInsights: calculateDocumentInsights(nextCareerDocuments),
            activityLog: prependActivityLogEntry(state.activityLog, {
              eventType: 'document_upload',
              source: 'documents',
              title: 'Document uploaded',
              description: `${nextDocument.name} was added to Documents & Insights.`,
            }),
          }
        }),
      updateCareerDocument: (id, updates) =>
        set((state) => {
          const targetDocument = state.careerDocuments.find(item => item.id === id)
          if (!targetDocument) return state

          const nextCareerDocuments = state.careerDocuments.map(item =>
            item.id === id
              ? {
                  ...item,
                  ...updates,
                  id: item.id,
                  createdAt: item.createdAt,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )

          const didStatusChange = typeof updates.status !== 'undefined' && updates.status !== targetDocument.status
          const updateDescription = didStatusChange
            ? `${targetDocument.name} moved from ${targetDocument.status} to ${updates.status}.`
            : `${targetDocument.name} details were updated.`

          return {
            ...state,
            careerDocuments: nextCareerDocuments,
            documentInsights: calculateDocumentInsights(nextCareerDocuments),
            activityLog: prependActivityLogEntry(state.activityLog, {
              eventType: 'document_update',
              source: 'documents',
              title: 'Document updated',
              description: updateDescription,
            }),
          }
        }),
      removeCareerDocument: (id) =>
        set((state) => {
          const targetDocument = state.careerDocuments.find(item => item.id === id)
          const nextCareerDocuments = state.careerDocuments.filter(item => item.id !== id)
          if (!targetDocument) {
            return {
              ...state,
              careerDocuments: nextCareerDocuments,
              documentInsights: calculateDocumentInsights(nextCareerDocuments),
            }
          }

          return {
            ...state,
            careerDocuments: nextCareerDocuments,
            documentInsights: calculateDocumentInsights(nextCareerDocuments),
            activityLog: prependActivityLogEntry(state.activityLog, {
              eventType: 'document_remove',
              source: 'documents',
              title: 'Document removed',
              description: `${targetDocument.name} was removed from Documents & Insights.`,
            }),
          }
        }),
      addActivityLogEntry: (entry) =>
        set((state) => ({
          ...state,
          activityLog: prependActivityLogEntry(state.activityLog, entry),
        })),
      markActivityLogExported: (source = 'settings') =>
        set((state) => ({
          ...state,
          activityLog: prependActivityLogEntry(state.activityLog, {
            eventType: 'data_export',
            source,
            title: 'Activity log exported',
            description: `Exported ${state.activityLog.length} activity entries as CSV.`,
          }),
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
