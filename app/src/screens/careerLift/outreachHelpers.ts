import { JobEntry } from '../../store/jobTrackerStore'

export const isOutreachAction = (nextAction: string) => {
  const normalized = nextAction.toLowerCase()
  return (
    normalized.includes('follow up email') ||
    normalized.includes('follow-up email') ||
    normalized.includes('follow up / test') ||
    normalized.includes('follow-up / test') ||
    (normalized.includes('follow') && normalized.includes('email')) ||
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
