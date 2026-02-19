import * as React from 'react'
import { JobEntry, useJobTrackerStore } from '../../../store/jobTrackerStore'
import { isThankYouAction } from '../outreachHelpers'

export type WeeklyActionItem = {
  id: string
  title: string
  subtitle: string
  type: 'action' | 'generic'
  job?: JobEntry
}

export type ActionDecisionPrompt = {
  action: WeeklyActionItem
  title: string
  message: string
  confirmLabel: string
  denyLabel: string
}

type TrackedActionType = 'submit' | 'followup' | 'interview' | 'offer' | 'thankyou'

const FALLBACK_ACTIONS: WeeklyActionItem[] = [
  {
    id: 'a1',
    title: 'Boost Outreach Volume',
    subtitle: 'Aim for 5 more cold emails to improve top-of-funnel.',
    type: 'generic',
  },
  {
    id: 'a2',
    title: 'Interview Follow-up',
    subtitle: 'Follow up with TechCorp regarding your interview.',
    type: 'generic',
  },
  {
    id: 'a3',
    title: 'Portfolio Maintenance',
    subtitle: 'Update portfolio link on LinkedIn profile.',
    type: 'generic',
  },
]

const normalizeActionTitle = (title: string) => title.trim().toLowerCase()
const getActionKey = (action: WeeklyActionItem) => `${action.id}:${action.title}`

export const getTrackedActionType = (title: string): TrackedActionType | null => {
  const normalized = normalizeActionTitle(title)

  if (normalized.includes('submit application') || normalized.includes('apply')) {
    return 'submit'
  }

  if (isThankYouAction(normalized)) {
    return 'thankyou'
  }

  if (
    normalized.includes('follow') ||
    normalized.includes('response') ||
    normalized.includes('reply') ||
    normalized.includes('check-in') ||
    normalized.includes('outreach') ||
    normalized.includes('recruiter') ||
    normalized.includes('coffee chat')
  ) {
    return 'followup'
  }

  if (normalized.includes('interview') || normalized.includes('screen')) {
    return 'interview'
  }

  if (normalized.includes('offer') || normalized.includes('sign')) {
    return 'offer'
  }

  return null
}

const resolveActionTarget = (action: WeeklyActionItem) => {
  const normalizedTitle = action.title.toLowerCase()

  if (normalizedTitle.includes('submit application') || normalizedTitle.includes('apply')) {
    if (action.job) {
      return { screen: 'ApplyPack', params: { job: action.job } }
    }
    return { screen: 'JobTracker', params: { openAddJobModal: true } }
  }

  if (
    isThankYouAction(normalizedTitle) ||
    normalizedTitle.includes('follow') ||
    normalizedTitle.includes('response') ||
    normalizedTitle.includes('reply') ||
    normalizedTitle.includes('check-in') ||
    normalizedTitle.includes('outreach') ||
    normalizedTitle.includes('recruiter') ||
    normalizedTitle.includes('coffee chat')
  ) {
    if (action.job) {
      return { screen: 'OutreachCenter', params: { job: action.job } }
    }
    return { screen: 'OutreachCenter' }
  }

  if (normalizedTitle.includes('interview') || normalizedTitle.includes('screen')) {
    if (action.job) {
      return { screen: 'InterviewPrep', params: { job: action.job } }
    }
    return { screen: 'InterviewPrep' }
  }

  if (normalizedTitle.includes('offer') || normalizedTitle.includes('sign')) {
    if (action.job) {
      return { screen: 'ApplyPack', params: { job: action.job } }
    }
    return { screen: 'ApplyPack' }
  }

  if (normalizedTitle.includes('portfolio') || normalizedTitle.includes('linkedin')) {
    return { screen: 'LinkedInKit' }
  }

  return { screen: 'JobTracker' }
}

const buildDecisionPrompt = (action: WeeklyActionItem): ActionDecisionPrompt | null => {
  if (action.type !== 'action' || !action.job) return null

  const trackedType = getTrackedActionType(action.title)
  const normalizedTitle = action.title.toLowerCase()
  const isCoffeeChat = normalizedTitle.includes('coffee chat')
  if (!trackedType) return null

  if (trackedType === 'submit') {
    return {
      action,
      title: 'Confirm Submission',
      message: `Did you submit your application for ${action.job.role} at ${action.job.company}?`,
      confirmLabel: 'Yes, submitted',
      denyLabel: 'Not yet',
    }
  }

  if (trackedType === 'followup') {
    if (isCoffeeChat) {
      return {
        action,
        title: 'Coffee Chat Completed?',
        message: `Did you complete the coffee chat for ${action.job.company}?`,
        confirmLabel: 'Yes, completed',
        denyLabel: 'Not yet',
      }
    }
    return {
      action,
      title: 'Did They Respond?',
      message: `Record the follow-up result for ${action.job.company}.`,
      confirmLabel: 'Yes, responded',
      denyLabel: 'No response yet',
    }
  }

  if (trackedType === 'thankyou') {
    return {
      action,
      title: 'Thank-you Sent?',
      message: `Did you send the thank-you note to ${action.job.company}?`,
      confirmLabel: 'Yes, sent',
      denyLabel: 'Not yet',
    }
  }

  if (trackedType === 'interview') {
    return {
      action,
      title: 'Interview Outcome',
      message: `Did ${action.job.company} move you to the next step?`,
      confirmLabel: 'Yes, next step',
      denyLabel: 'No, not selected',
    }
  }

  return {
    action,
    title: 'Offer Decision',
    message: `Was the offer from ${action.job.company} accepted?`,
    confirmLabel: 'Accepted',
    denyLabel: 'Rejected',
  }
}

type UseTaskChecklistFlowOptions = {
  limit?: number
  includeFallback?: boolean
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void
}

export function useTaskChecklistFlow(options: UseTaskChecklistFlowOptions = {}) {
  const { limit = 3, includeFallback = true, onNavigate } = options
  const { nextUp, updateJobStatus, updateJobAction } = useJobTrackerStore(state => state)

  const [completedActions, setCompletedActions] = React.useState<WeeklyActionItem[]>([])
  const [decisionPrompt, setDecisionPrompt] = React.useState<ActionDecisionPrompt | null>(null)
  const previousActionsRef = React.useRef<WeeklyActionItem[]>([])

  const nextActions = React.useMemo(() => {
    return nextUp
      .filter(job => job.nextAction)
      .slice(0, limit)
      .map(job => ({
        id: job.id,
        title: job.nextAction,
        subtitle: `${job.role} at ${job.company}`,
        type: 'action' as const,
        job,
      }))
  }, [nextUp, limit])

  const displayActions = React.useMemo(() => {
    if (nextActions.length > 0 || !includeFallback) return nextActions
    return FALLBACK_ACTIONS
  }, [nextActions, includeFallback])

  React.useEffect(() => {
    const previousActions = previousActionsRef.current
    if (previousActions.length === 0) {
      previousActionsRef.current = nextActions
      return
    }

    const currentActionsByJobId = new Map(
      nextActions.filter(action => action.job).map(action => [action.job!.id, action])
    )

    const newlyCompletedTrackedActions = previousActions.filter(previousAction => {
      if (!previousAction.job) return false
      const previousActionType = getTrackedActionType(previousAction.title)
      if (!previousActionType) return false
      const currentAction = currentActionsByJobId.get(previousAction.job.id)
      if (!currentAction) return true
      const currentActionType = getTrackedActionType(currentAction.title)
      if (!currentActionType) return true
      return normalizeActionTitle(currentAction.title) !== normalizeActionTitle(previousAction.title)
    })

    if (newlyCompletedTrackedActions.length > 0) {
      setCompletedActions(existingCompleted => {
        const existingKeys = new Set(existingCompleted.map(getActionKey))
        const toAdd = newlyCompletedTrackedActions.filter(action => !existingKeys.has(getActionKey(action)))
        return toAdd.length > 0 ? [...existingCompleted, ...toAdd] : existingCompleted
      })
    }

    previousActionsRef.current = nextActions
  }, [nextActions])

  const markActionCompleted = React.useCallback((action: WeeklyActionItem) => {
    setCompletedActions(prev => {
      const actionKey = getActionKey(action)
      if (prev.some(item => getActionKey(item) === actionKey)) return prev
      return [...prev, action]
    })
  }, [])

  const unmarkActionCompleted = React.useCallback((action: WeeklyActionItem) => {
    const actionKey = getActionKey(action)
    setCompletedActions(prev => prev.filter(item => getActionKey(item) !== actionKey))
  }, [])

  const applyActionDecision = React.useCallback(
    (action: WeeklyActionItem, decision: 'confirm' | 'deny') => {
      if (action.type === 'generic') {
        if (decision === 'confirm') markActionCompleted(action)
        return
      }

      if (!action.job) return

      const title = action.title.toLowerCase()
      const job = action.job

      if (title.includes('submit') || title.includes('apply')) {
        if (decision === 'confirm') {
          updateJobStatus(job.id, 'Applied')
          updateJobAction(job.id, 'Follow up', 'in 3 days')
          markActionCompleted(action)
        }
        return
      }

      if (
        title.includes('follow') ||
        title.includes('response') ||
        title.includes('reply') ||
        title.includes('check-in') ||
        title.includes('outreach') ||
        title.includes('recruiter') ||
        title.includes('coffee chat')
      ) {
        const isCoffeeChat = title.includes('coffee chat')
        if (isCoffeeChat) {
          if (decision === 'confirm') {
            updateJobStatus(job.id, 'Interviewing')
            updateJobAction(job.id, 'Send thank-you note', 'Tomorrow')
          } else {
            updateJobAction(job.id, 'Reschedule coffee chat', 'in 2 days')
          }
        } else if (decision === 'confirm') {
          updateJobStatus(job.id, 'Interviewing')
          updateJobAction(job.id, 'Interview Prep', 'This week')
        } else {
          updateJobAction(job.id, 'Send second follow-up', 'in 3 days')
        }
        markActionCompleted(action)
        return
      }

      if (isThankYouAction(title)) {
        if (decision === 'confirm') {
          updateJobAction(job.id, 'Check response', 'in 2 days')
          markActionCompleted(action)
        }
        return
      }

      if (title.includes('interview')) {
        if (decision === 'confirm') {
          updateJobStatus(job.id, 'Interviewing')
          updateJobAction(job.id, 'Send Thank You', 'Tomorrow')
        } else {
          updateJobStatus(job.id, 'Rejected')
          updateJobAction(job.id, 'Keep pipeline warm', 'This week')
        }
        markActionCompleted(action)
        return
      }

      if (title.includes('offer')) {
        if (decision === 'confirm') {
          updateJobStatus(job.id, 'Offer Signed')
          updateJobAction(job.id, 'Prepare for onboarding', 'Next Week')
        } else {
          updateJobStatus(job.id, 'Rejected')
          updateJobAction(job.id, 'Continue search', 'This week')
        }
        markActionCompleted(action)
        return
      }

      if (decision === 'confirm') {
        updateJobAction(job.id, '', '')
        markActionCompleted(action)
      }
    },
    [markActionCompleted, updateJobAction, updateJobStatus]
  )

  const handleCheckAction = React.useCallback(
    (action: WeeklyActionItem) => {
      if (action.type === 'generic') {
        markActionCompleted(action)
        return
      }

      const prompt = buildDecisionPrompt(action)
      if (!prompt) {
        applyActionDecision(action, 'confirm')
        return
      }

      setDecisionPrompt(prompt)
    },
    [applyActionDecision, markActionCompleted]
  )

  const handlePlanActionPress = React.useCallback(
    (action: WeeklyActionItem) => {
      const target = resolveActionTarget(action)
      onNavigate?.(target.screen, target.params)
    },
    [onNavigate]
  )

  const activeActions = React.useMemo(
    () => displayActions.filter(a => !completedActions.some(ca => getActionKey(ca) === getActionKey(a))),
    [displayActions, completedActions]
  )

  return {
    displayActions,
    activeActions,
    completedActions,
    decisionPrompt,
    setDecisionPrompt,
    applyActionDecision,
    handleCheckAction,
    handlePlanActionPress,
    unmarkActionCompleted,
  }
}
