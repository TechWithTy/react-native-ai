import { create } from 'zustand'

export type PipelineStat = {
  label: string
  value: number
  trend?: number // e.g. +2
  tone: 'primary' | 'purple' | 'solid'
}

interface DashboardState {
  pipeline: PipelineStat[]
  weeklyPlan: {
    current: number
    target: number
    label: string
  }
}

export const useDashboardStore = create<DashboardState>(() => ({
  pipeline: [
    { label: 'Applied', value: 12, trend: 2, tone: 'primary' },
    { label: 'Interviews', value: 3, tone: 'purple' },
    { label: 'Offers', value: 1, tone: 'solid' },
  ],
  weeklyPlan: {
    current: 5,
    target: 10,
    label: 'Halfway there! Keep the momentum going.',
  },
}))
