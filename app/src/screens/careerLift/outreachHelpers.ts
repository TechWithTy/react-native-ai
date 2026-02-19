import { JobEntry } from '../../store/jobTrackerStore'

export const isResponseCheckAction = (nextAction: string) => {
  const normalized = nextAction.toLowerCase()
  return (
    normalized.includes('check response') ||
    normalized.includes('response check') ||
    normalized.includes('did they respond') ||
    normalized.includes('awaiting response')
  )
}

export const isCoffeeChatAction = (nextAction: string) => {
  const normalized = nextAction.toLowerCase()
  return (
    normalized.includes('coffee chat') ||
    (normalized.includes('coffee') && normalized.includes('chat')) ||
    normalized.includes('recruiter call')
  )
}

export const isThankYouAction = (nextAction: string) => {
  const normalized = nextAction.toLowerCase()
  return (
    normalized.includes('send thank you') ||
    normalized.includes('send thank-you') ||
    normalized.includes('thank you note') ||
    normalized.includes('thank-you note') ||
    normalized.includes('thankyou') ||
    normalized.includes('thanks')
  )
}

export const isOutreachAction = (nextAction: string) => {
  const normalized = nextAction.toLowerCase()
  if (isResponseCheckAction(normalized) || isCoffeeChatAction(normalized)) {
    return false
  }
  return (
    isThankYouAction(normalized) ||
    normalized.includes('follow up') ||
    normalized.includes('follow-up') ||
    normalized.includes('follow up email') ||
    normalized.includes('follow-up email') ||
    normalized.includes('follow up / test') ||
    normalized.includes('follow-up / test') ||
    normalized.includes('check-in') ||
    normalized.includes('recruiter') ||
    normalized.includes('outreach') ||
    (normalized.includes('follow') && normalized.includes('email')) ||
    normalized.includes('reply') ||
    normalized.includes('test')
  )
}

export const buildOutreachDraft = (job: JobEntry) => {
  return [
    `Hi ${job.company} team,`,
    '',
    `Quick follow-up on my application for the ${job.role} role.`,
    'I remain very interested and would love to continue the process.',
    '',
    'If helpful, I can also share a short work sample aligned to this role.',
    '',
    'Thank you for your time,',
    '[Your Name]',
  ].join('\n')
}
