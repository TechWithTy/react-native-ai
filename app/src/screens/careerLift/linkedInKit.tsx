import { MockScreen, card } from './shared'

export function LinkedInKitScreen() {
  return (
    <MockScreen
      title='LinkedIn Kit'
      subtitle='Profile strength 85%'
      chips={['Concise', 'Technical', 'Headline', 'About Me', 'Experience', 'Skills']}
      sections={[
        card('From Resume', 'Senior software engineer handling frontend tasks with React and TypeScript.'),
        card(
          'Optimized for LinkedIn',
          'Senior Software Engineer | React & TypeScript Specialist | Architecting Scalable Frontend Solutions'
        ),
        card('Quick Wins', undefined, ['Add top 5 skills (done)', 'Enable Open to Work', 'Upload background banner']),
      ]}
      footerTabs={[
        { label: 'Home' },
        { label: 'Optimize', active: true },
        { label: 'AI Coach' },
        { label: 'Jobs' },
        { label: 'Profile' },
      ]}
    />
  )
}

