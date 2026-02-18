import { MockScreen, card } from './shared'

export function WeeklyDigestScreen() {
  return (
    <MockScreen
      title='Weekly Digest'
      subtitle='Oct 23 - Oct 30'
      sections={[
        card('Proof of Work', undefined, [
          'Applications: 12 (+20% vs last week)',
          'Outreach: 25 / 30 target',
          'Interviews attended: 2',
        ]),
        card('Conversion Funnel', undefined, [
          'Applications: 100%',
          'Interviews: 16%',
          'Offers: pending',
        ]),
        card('Next Week Plan', undefined, [
          'Boost outreach volume',
          'Interview follow-up with TechCorp',
          'Portfolio maintenance',
        ]),
      ]}
      footerTabs={[
        { label: 'Home' },
        { label: 'Stats' },
        { label: 'Tasks', active: true },
        { label: 'Profile' },
      ]}
    />
  )
}

