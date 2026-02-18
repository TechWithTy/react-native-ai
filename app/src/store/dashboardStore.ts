import { create } from 'zustand'

export type ActionItem = {
  id: string
  title: string
  tag: string
  isCompleted: boolean
  isDueToday?: boolean
  muted?: boolean
}

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
  nextActions: ActionItem[]
  toggleAction: (id: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
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
  nextActions: [
    { id: '1', title: 'Follow up with Acme Corp', tag: 'Due Today', isCompleted: false, isDueToday: true },
    { id: '2', title: 'Review Apply Pack for Google', tag: 'Tomorrow', isCompleted: false },
    { id: '3', title: 'Update LinkedIn Headline', tag: 'General', isCompleted: false, muted: true },
  ],
  toggleAction: (id) =>
    set((state) => ({
      nextActions: state.nextActions.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      ),
    })),
}))
