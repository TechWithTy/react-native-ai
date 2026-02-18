import { create } from 'zustand'

export type JobEntry = {
  id: string
  company: string
  role: string
  location: string
  status: 'Interview' | 'Applied' | 'Target' | 'Offer Received' | 'Offer Signed' | 'Rejected' | 'Not Interested'
  nextAction: string
  nextActionDate: string
  isOverdue?: boolean
  logo?: string
  color?: string
  match?: string
  tags?: string[]
  salary?: string
  notes?: string
}

interface JobTrackerState {
  activeFilter: string
  filters: string[]
  setFilter: (filter: string) => void
  thisWeek: JobEntry[]
  nextUp: JobEntry[]
  recommendedJobs: JobEntry[]
  updateJobStatus: (id: string, status: JobEntry['status']) => void
  updateJobNotes: (id: string, notes: string) => void
  addJob: (job: JobEntry) => void
}

export const useJobTrackerStore = create<JobTrackerState>((set) => ({
  activeFilter: 'All Roles',
  filters: ['All Roles', 'Product Design', 'Engineering', 'Remote'],
  setFilter: (filter) => set({ activeFilter: filter }),
  thisWeek: [
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
  ],
  nextUp: [
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
  ],
  recommendedJobs: [
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
      color: '#f5f7f8'
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
      color: '#f5f7f8'
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
      color: '#f5f7f8'
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
      color: '#f5f7f8'
    }
  ],
  updateJobStatus: (id, status) => set((state) => {
    // Helper to find and update job
    const updateList = (list: JobEntry[]) => list.map(job => job.id === id ? { ...job, status } : job)
    
    // We need to move jobs between lists based on status
    // For simplicity in this demo, we'll just update them in place if they exist, 
    // but in a real app we might move them from 'nextUp' to 'thisWeek' etc.
    // Actually, let's just update all lists
    return {
      thisWeek: updateList(state.thisWeek),
      nextUp: updateList(state.nextUp),
      recommendedJobs: updateList(state.recommendedJobs)
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
    thisWeek: [job, ...state.thisWeek]
  }))
}))
