import { MockScreen, card } from './shared'

export function OutreachCenterScreen() {
  return (
    <MockScreen
      title='Outreach Center'
      subtitle='Manage your network'
      sections={[
        card('Summary', undefined, ['To Do Today: 5', 'Pending: 12', 'Sent This Week: 8']),
        card('Needs Attention', undefined, [
          'Sarah Jenkins - Due today - Draft ready',
          'Jordan Smith - Due today - Value add follow-up',
        ]),
        card('Referral Asks', undefined, ['Intro to Coinbase - waiting on Mike R.']),
        card('Message Composer', 'Draft preview and copy-to-clipboard action.'),
      ]}

    />
  )
}

