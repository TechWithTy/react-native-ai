import { create } from 'zustand'

export type JobEntry = {
  id: string
  company: string
  role: string
  location: string
  status: 'Interview' | 'Interviewing' | 'Applied' | 'Target' | 'Offer Received' | 'Offer Signed' | 'Rejected' | 'Not Interested'
  nextAction: string
  nextActionDate: string
  isOverdue?: boolean
  logo?: string
  color?: string
  match?: string
  tags?: string[]
  salary?: string
  notes?: string
  savedFromRecommended?: boolean
}

export type RecommendedScreenFilter = 'All Matches' | 'Remote' | 'Full-time' | 'Product Design'
export type RecommendedSortOption = 'matchDesc' | 'matchAsc' | 'roleAZ' | 'companyAZ'
export type RecommendedSalaryRange = 'Any' | '<$80k' | '$100k+' | '$150k+' | '$180k+'
export type RecommendedExperienceLevel = 'Any' | 'Entry' | 'Mid' | 'Senior' | 'Lead+'

type RecommendedScanPresetDraft = {
  screenFilter: RecommendedScreenFilter
  sortBy: RecommendedSortOption
  remoteOnly: boolean
  fullTimeOnly: boolean
  hybridOnly: boolean
  locationQuery: string
  salaryRange?: RecommendedSalaryRange
  experienceLevel?: RecommendedExperienceLevel
  name?: string
}

export type RecommendedScanPreset = Omit<RecommendedScanPresetDraft, 'name' | 'salaryRange' | 'experienceLevel'> & {
  salaryRange: RecommendedSalaryRange
  experienceLevel: RecommendedExperienceLevel
  name: string
  label: string
  savedAt: string
}

const buildRecommendedPresetLabel = (preset: RecommendedScanPresetDraft) => {
  const parts = new Set<string>()

  if (preset.screenFilter !== 'All Matches') parts.add(preset.screenFilter)
  if (preset.remoteOnly) parts.add('Remote')
  if (preset.fullTimeOnly) parts.add('Full-time')
  if (preset.hybridOnly) parts.add('Hybrid')
  if (preset.salaryRange && preset.salaryRange !== 'Any') parts.add(preset.salaryRange)
  if (preset.experienceLevel && preset.experienceLevel !== 'Any') parts.add(`${preset.experienceLevel} level`)
  const trimmedLocation = preset.locationQuery.trim()
  if (trimmedLocation) parts.add(trimmedLocation)

  const labels = Array.from(parts)
  return labels.length > 0 ? labels.join(' • ') : 'All Matches'
}

interface JobTrackerState {
  activeFilter: string
  filters: string[]
  setFilter: (filter: string) => void
  recommendedActiveFilter: RecommendedScreenFilter
  setRecommendedActiveFilter: (filter: RecommendedScreenFilter) => void
  recommendedScanPreset: RecommendedScanPreset | null
  saveRecommendedScanPreset: (preset: RecommendedScanPresetDraft) => void
  clearRecommendedScanPreset: () => void
  thisWeek: JobEntry[]
  nextUp: JobEntry[]
  recommendedJobs: JobEntry[]
  savedJobIds: string[]
  toggleSaveJob: (job: JobEntry) => void
  updateJobStatus: (id: string, status: JobEntry['status']) => void
  updateJobNotes: (id: string, notes: string) => void
  addJob: (job: JobEntry) => void
  resetJobTrackerStore: () => void
}

const initialThisWeek: JobEntry[] = [
  {
    id: '1',
    company: 'Google',
    role: 'Senior UX Engineer',
    location: 'Mountain View',
    status: 'Interview',
    nextAction: 'Technical Screen',
    nextActionDate: 'Tomorrow, 2:00 PM',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAN_jOI98mx2uRVpTvqusbwnMajISru54Vcd5bg5Qm-irAwNaxA6_8BeGcwKuBfYbwdF6aH_OtDkZO27-Qk4wXMiCWZR-Wi7VhdoGn3C77OJpUnn2j-t8eeq3Mkb6r1EAw34xixYkJKGRYtdxTMipytkHOhJJy3wx5gjYuGaXHsckgGNCysnDNPmQ9BORfNR7yvKksqAygx_OTDPKco1-mY5cfEwpBnO44QmPlA3ahqj3lv23twtGnzyr5bIvxgAlKgGEHfw77kMMhh',
  },
  {
    id: '2',
    company: 'Stripe',
    role: 'Staff Product Designer',
    location: 'Remote',
    status: 'Applied',
    nextAction: 'Follow up email',
    nextActionDate: 'Due in 2 days',
    color: '#635BFF',
  },
]

const initialNextUp: JobEntry[] = [
  {
    id: '3',
    company: 'Airbnb',
    role: 'Design Lead',
    location: 'San Francisco',
    status: 'Target',
    nextAction: 'Submit Application',
    nextActionDate: 'Overdue',
    isOverdue: true,
    color: '#FF5A5F',
  },
  {
    id: '4',
    company: 'Netflix',
    role: 'Senior Product Designer',
    location: 'Los Gatos',
    status: 'Target',
    nextAction: 'Coffee Chat w/ Recruiter',
    nextActionDate: 'Fri, Oct 24',
    color: '#000000',
  },
  {
    id: '5',
    company: 'Spotify',
    role: 'Product Designer',
    location: 'New York',
    status: 'Offer Received',
    nextAction: 'Sign Offer Letter',
    nextActionDate: 'Reviewing',
    color: '#1DB954',
  },
]

const initialRecommendedJobs: JobEntry[] = [
  {
    id: 'j1',
    company: 'Stellar AI',
    role: 'Senior Product Designer',
    location: 'San Francisco, CA',
    status: 'Target',
    nextAction: 'Apply',
    nextActionDate: 'Today',
    match: '96%',
    tags: ['Remote', 'Full-time', '$160k - $210k'],
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUxNKyiqVhqbAIrrFGWSqfqK-mM8xisy4pXPmHLjPVsFYDpy089SKojXPoycHHbkKnZkLVUDNtFmsrt34NPbTH_AzyDoXVO9czN5ECp_iJB8qlJmNgau1X-7UfskmTzQXSov-JUC_rAnBDZmIa41g1Zn8kd-ICjX7cZMhgQDiJHOc5_TxUmgIaTD_xU3lJjcMay1706ITKASvXQVWngHGhJuz6bkk2RItbijEspibZwiFt3mDhBcFvVrEfbWpSNOmLLyNxNj_pc3P0',
    color: '#f5f7f8',
  },
  {
    id: 'j2',
    company: 'FinFlow',
    role: 'Lead UX Researcher',
    location: 'New York, NY',
    status: 'Target',
    nextAction: 'Apply',
    nextActionDate: 'Today',
    match: '92%',
    tags: ['Hybrid', 'Full-time', '$145k - $185k'],
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCnaOER00RRzpV7nUIlJCot9nxvhix0tGudFiGlfewQE7gEy8J4k5HyK7UDX8A3wG3xQScwPnlY9UXObx9D0Zfk5sMywOnLA5U8BTa8KnONyoyNaSx2rUgjdG9Jsx5JjZITnmsBYjUOoJ_u0zlfY1dDAFgsUTZrxoVb7-2KuTYwFxfSP4owvnWidwhnLz2TLor6mKuGh1EqDebriMvO14inWSLm9irlkSx_bSlYFVV51BUw_ajt16sJ-f6TorPL5EKqzxcSML_5ZuO',
    color: '#f5f7f8',
  },
  {
    id: 'j3',
    company: 'Nexus Systems',
    role: 'Staff Product Manager',
    location: 'Austin, TX',
    status: 'Target',
    nextAction: 'Apply',
    nextActionDate: 'Today',
    match: '88%',
    tags: ['Remote', 'Full-time', '$180k+'],
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB367XkOeJ6oOxMITxcDH82YG0DVu0PxYpfMh236Z-v8Yx5o614ZkSkXumatMzamies-FyTABrErta_PVJIrGydD-vO76qHqCAnULrfT5ps_0cA3k9GqQpaoKlckMpfkiXstALEGxC6PWc9AtziSLLpPFBvHPn9AUXYIFHaWAsTNefs6CweJuqP3c6NTqRZy_V_sQwS_HkHmHsKZ2Dac52IAPgvVNUHjVzpB1uHlATmt45ZYdnHRA8MP4Ie3VXYFPTrTViB4uZvTUvm',
    color: '#f5f7f8',
  },
  {
    id: 'j4',
    company: 'Loomly',
    role: 'Interaction Designer',
    location: 'Remote',
    status: 'Target',
    nextAction: 'Apply',
    nextActionDate: 'Today',
    match: '85%',
    tags: ['Remote', 'Contract', '$90 - $120 / hr'],
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKsKb4auaJiDMg9u1UP4E6RaR09AUgvxiTohTdLNGPE6_rIAcdT8GGpUItIxx5mbG-j9_YRZNxdXEs7OVyUnQXXPrYEUL5fqNmmooNz6zKdmE5rFjFbFrzILbzbrslDhCOH-HpFN73SqsP-egRElKKIglC9PAEVdMuV8KsB44gEdM05vpIJqQztfzVDRFAUf8WLVTp5syHr3tUO23fp7Zkinp0vO8K1zo-USHzWVtKbWNHqSu8779gaiHTpLiN64NM67Uf3pdZFiZO',
    color: '#f5f7f8',
  },
]

const cloneJobs = (jobs: JobEntry[]) =>
  jobs.map(job => ({
    ...job,
    tags: job.tags ? [...job.tags] : undefined,
  }))

const getDefaultState = () => ({
  activeFilter: 'All Roles',
  filters: ['All Roles', 'Product Design', 'Engineering', 'Remote'],
  recommendedActiveFilter: 'All Matches' as RecommendedScreenFilter,
  recommendedScanPreset: null as RecommendedScanPreset | null,
  thisWeek: cloneJobs(initialThisWeek),
  nextUp: cloneJobs(initialNextUp),
  recommendedJobs: cloneJobs(initialRecommendedJobs),
  savedJobIds: [] as string[],
})

export const useJobTrackerStore = create<JobTrackerState>((set) => ({
  ...getDefaultState(),
  setFilter: (filter) => set({ activeFilter: filter }),
  setRecommendedActiveFilter: (filter) => set({ recommendedActiveFilter: filter }),
  saveRecommendedScanPreset: (preset) =>
    set(() => {
      const locationQuery = preset.locationQuery.trim()
      const salaryRange = preset.salaryRange || 'Any'
      const experienceLevel = preset.experienceLevel || 'Any'
      const label = buildRecommendedPresetLabel({ ...preset, locationQuery, salaryRange, experienceLevel })
      const name = preset.name?.trim() || label

      return {
        recommendedScanPreset: {
          ...preset,
          locationQuery,
          salaryRange,
          experienceLevel,
          name,
          label,
          savedAt: new Date().toISOString(),
        },
      }
    }),
  clearRecommendedScanPreset: () => set({ recommendedScanPreset: null }),
  toggleSaveJob: (job) =>
    set((state) => {
      const alreadySaved = state.savedJobIds.includes(job.id)

      if (alreadySaved) {
        return {
          savedJobIds: state.savedJobIds.filter(savedId => savedId !== job.id),
          nextUp: state.nextUp.filter(entry => !(entry.id === job.id && entry.savedFromRecommended)),
          recommendedJobs: state.recommendedJobs.map(entry =>
            entry.id === job.id ? { ...entry, savedFromRecommended: false } : entry
          ),
        }
      }

      const normalizedSavedJob: JobEntry = {
        ...job,
        status: 'Target',
        nextAction: job.nextAction || 'Submit Application',
        nextActionDate: job.nextActionDate || 'Today',
        savedFromRecommended: true,
      }

      const existsInThisWeek = state.thisWeek.some(entry => entry.id === job.id)
      const existsInNextUp = state.nextUp.some(entry => entry.id === job.id)

      return {
        savedJobIds: Array.from(new Set([...state.savedJobIds, job.id])),
        thisWeek: existsInThisWeek
          ? state.thisWeek.map(entry => (entry.id === job.id ? { ...entry, status: 'Target' } : entry))
          : state.thisWeek,
        nextUp: existsInNextUp
          ? state.nextUp.map(entry =>
              entry.id === job.id
                ? { ...entry, status: 'Target', savedFromRecommended: entry.savedFromRecommended ?? true }
                : entry
            )
          : [normalizedSavedJob, ...state.nextUp],
        recommendedJobs: state.recommendedJobs.map(entry =>
          entry.id === job.id ? { ...entry, status: 'Target', savedFromRecommended: true } : entry
        ),
      }
    }),
  updateJobStatus: (id, status) => set((state) => {
    const updateList = (list: JobEntry[]) => list.map(job => job.id === id ? { ...job, status } : job)

    return {
      thisWeek: updateList(state.thisWeek),
      nextUp: updateList(state.nextUp).map(job =>
        job.id === id && status !== 'Target' ? { ...job, savedFromRecommended: false } : job
      ),
      recommendedJobs: updateList(state.recommendedJobs).map(job =>
        job.id === id && status !== 'Target' ? { ...job, savedFromRecommended: false } : job
      ),
      savedJobIds:
        status === 'Target'
          ? Array.from(new Set([...state.savedJobIds, id]))
          : state.savedJobIds.filter(savedId => savedId !== id),
    }
  }),
  updateJobNotes: (id, notes) => set((state) => {
    const updateList = (list: JobEntry[]) => list.map(job => job.id === id ? { ...job, notes } : job)
    return {
      thisWeek: updateList(state.thisWeek),
      nextUp: updateList(state.nextUp),
      recommendedJobs: updateList(state.recommendedJobs)
    }
  }),
  addJob: (job) => set((state) => ({
    thisWeek: [job, ...state.thisWeek],
    savedJobIds:
      job.status === 'Target'
        ? Array.from(new Set([...state.savedJobIds, job.id]))
        : state.savedJobIds,
  })),
  resetJobTrackerStore: () => set(getDefaultState()),
}))
