import { MockScreen, card } from './shared'

export function AIOnboardingScreen() {
  return (
    <MockScreen
      title='Career Goals'
      subtitle='Step 2 of 5'
      chips={['Google', 'Stripe', 'Goldman Sachs', 'Chase', 'Robinhood']}
      sections={[
        card('Lift Assistant', 'What industry are you targeting next?'),
        card('User Reply', 'I am looking mostly at Fintech.'),
        card('Lift Assistant', 'What are your top three target companies?'),
        card('Input Composer', 'Quick replies, text input, and send action.'),
      ]}
    />
  )
}

