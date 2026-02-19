import { NotificationItem } from './components/notificationsPanel'

export const careerLiftNotifications: NotificationItem[] = [
  {
    id: 'n1',
    tone: 'urgent',
    title: 'Interview starts in 45 min',
    message: 'Acme Corp • Senior Engineer panel starts at 2:00 PM.',
    time: 'Today',
    target: {
      screen: 'InterviewPrep',
    },
  },
  {
    id: 'n2',
    tone: 'urgent',
    title: 'Application deadline tonight',
    message: 'Stripe role closes at 11:59 PM.',
    time: 'Today',
    target: {
      screen: 'ApplyPack',
    },
  },
  {
    id: 'n3',
    tone: 'non-emergent',
    title: 'Recruiter follow-up due',
    message: 'Send follow-up for Google by tomorrow morning.',
    time: 'Tomorrow',
    target: {
      screen: 'OutreachCenter',
      params: { jobId: '2' },
    },
  },
  {
    id: 'n4',
    tone: 'system',
    title: 'Weekly scan completed',
    message: '6 new matching roles found from your saved filters.',
    time: '2m ago',
    target: {
      screen: 'MainTabs',
      params: { screen: 'RecommendedJobs' },
    },
  },
  {
    id: 'n5',
    tone: 'system',
    title: 'Profile sync successful',
    message: 'LinkedIn and resume data are now aligned.',
    time: '1h ago',
    target: {
      screen: 'SettingsProfile',
    },
  },
]
