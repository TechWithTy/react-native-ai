import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CareerSetupState } from '../../types'
import { ROLE_GOALS_BY_TRACK } from '../data/goals'
import { ROLE_OPTIONS_BY_TRACK } from '../data/roles'
import { ROLE_SALARY_RANGES_BY_TRACK } from '../data/salary'
import { ROLE_SKILLS_BY_TRACK } from '../data/skills'

export { ROLE_OPTIONS_BY_TRACK }

export function getRoleOptionsForTrack(track: string): string[] {
  return ROLE_OPTIONS_BY_TRACK[track] || ROLE_OPTIONS_BY_TRACK.Engineering
}

export function getHighlightedSkillsForRole(track: string, role: string): string[] {
  const trackMap = ROLE_SKILLS_BY_TRACK[track] || ROLE_SKILLS_BY_TRACK.Engineering
  if (trackMap[role]) return trackMap[role]

  const lowerRole = role.toLowerCase()
  const partialMatch = Object.keys(trackMap).find(key => lowerRole.includes(key.toLowerCase()))
  if (partialMatch) return trackMap[partialMatch]

  const firstRole = getRoleOptionsForTrack(track)[0]
  return trackMap[firstRole] || []
}

export function getPositionGoalsForRole(track: string, role: string): string[] {
  const trackMap = ROLE_GOALS_BY_TRACK[track] || ROLE_GOALS_BY_TRACK.Engineering
  if (trackMap[role]) return trackMap[role]

  const lowerRole = role.toLowerCase()
  const partialMatch = Object.keys(trackMap).find(key => lowerRole.includes(key.toLowerCase()))
  if (partialMatch) return trackMap[partialMatch]

  const firstRole = getRoleOptionsForTrack(track)[0]
  return trackMap[firstRole] || []
}

export function getSalaryRangesForRole(track: string, role: string): string[] {
  const trackMap = ROLE_SALARY_RANGES_BY_TRACK[track] || ROLE_SALARY_RANGES_BY_TRACK.Engineering
  if (trackMap[role]) return trackMap[role]

  const lowerRole = role.toLowerCase()
  const partialMatch = Object.keys(trackMap).find(key => lowerRole.includes(key.toLowerCase()))
  if (partialMatch) return trackMap[partialMatch]

  const firstRole = getRoleOptionsForTrack(track)[0]
  return trackMap[firstRole] || []
}

const defaultCareerSetupState: CareerSetupState = {
  roleTrack: 'Engineering',
  seniority: 'Mid-level',
  workingStyle: 'Remote-first',
  targetRole: 'Software Engineer',
  desiredSalaryRange: '$120k-$150k',
  targetSeniority: 'Mid-Level',
  locationPreference: 'Hybrid',
  selectedGoals: [],
  selectedSkills: [],
  sourceResumeName: null,
  baselineResumeName: null,
}

type CareerSetupStore = CareerSetupState & {
  setCareerSetup: (updates: Partial<CareerSetupState>) => void
  resetCareerSetup: () => void
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

export const useCareerSetupStore = create<CareerSetupStore>()(
  persist(
    set => ({
      ...defaultCareerSetupState,
      setCareerSetup: updates => set(state => ({ ...state, ...updates })),
      resetCareerSetup: () => set(defaultCareerSetupState),
    }),
    {
      name: 'rnai-career-setup-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)
