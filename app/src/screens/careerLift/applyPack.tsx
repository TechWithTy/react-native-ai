import { MockScreen, card } from './shared'

export function ApplyPackScreen() {
  return (
    <MockScreen
      title='Review Package'
      subtitle='Senior Software Engineer · Google'
      chips={['94% Match', 'Variant 1']}
      sections={[
        card('Tailored Resume', undefined, ['Resume_Google_v1.pdf', 'Preview', 'Download']),
        card('Cover Note Draft', 'Role-tailored draft with company-specific motivation.'),
        card('Suggested Answers', undefined, [
          'Why do you want to work here?',
          'Salary expectations',
          'Notice period',
        ]),
      ]}
      cta='Approve and Log Submission'
    />
  )
}

