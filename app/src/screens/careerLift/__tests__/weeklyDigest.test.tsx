import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { WeeklyDigestScreen } from '../weeklyDigest'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'
import { useUserProfileStore } from '../../../store/userProfileStore'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}))

describe('WeeklyDigestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useJobTrackerStore.getState().resetJobTrackerStore()
    useUserProfileStore.getState().resetProfile()
  })

  it('opens notifications modal from header bell and supports clear actions', () => {
    const { getByLabelText, getByText, queryByText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Open notifications'))
    expect(getByText('Notifications')).toBeTruthy()
    expect(getByText('Interview starts in 45 min')).toBeTruthy()

    fireEvent.press(getByLabelText('Clear notification Interview starts in 45 min'))
    expect(queryByText('Interview starts in 45 min')).toBeNull()

    fireEvent.press(getByLabelText('Clear all notifications'))
    expect(getByText('No notifications right now.')).toBeTruthy()
  })

  it('navigates to ApplyPack from submit-application weekly action', () => {
    const { getByLabelText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Open action Submit Application'))

    expect(mockNavigate).toHaveBeenCalledWith(
      'ApplyPack',
      expect.objectContaining({
        job: expect.objectContaining({ id: '3' }),
      })
    )
  })

  it('navigates from actionable notification targets', () => {
    const { getByLabelText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Open notifications'))
    fireEvent.press(getByLabelText('Open notification Interview starts in 45 min'))

    expect(mockNavigate).toHaveBeenCalledWith('InterviewPrep', undefined)
  })

  it('marks submit task completed and loads follow-up task after applying', () => {
    const { getByText, getByLabelText, queryByLabelText } = render(<WeeklyDigestScreen />)

    expect(getByLabelText('Open action Submit Application')).toBeTruthy()

    act(() => {
      useJobTrackerStore.getState().updateJobStatus('3', 'Applied')
      useJobTrackerStore.getState().updateJobAction('3', 'Follow up', 'in 3 days')
    })

    expect(getByText('COMPLETED')).toBeTruthy()
    expect(getByText('Submit Application')).toBeTruthy()
    expect(queryByLabelText('Open action Submit Application')).toBeNull()
    expect(getByLabelText('Open action Follow up')).toBeTruthy()
  })

  it('marks follow-up task completed and loads next task', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Follow up', 'in 3 days')
    })

    const { getByText, getByLabelText, queryByLabelText } = render(<WeeklyDigestScreen />)
    expect(getByLabelText('Open action Follow up')).toBeTruthy()

    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Check response', 'in 2 days')
    })

    expect(getByText('COMPLETED')).toBeTruthy()
    expect(getByText('Follow up')).toBeTruthy()
    expect(queryByLabelText('Open action Follow up')).toBeNull()
    expect(getByLabelText('Open action Check response')).toBeTruthy()
  })

  it('marks interview task completed and loads thank-you task', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('4', 'Interview Prep', 'Tomorrow')
    })

    const { getByText, getByLabelText, queryByLabelText } = render(<WeeklyDigestScreen />)
    expect(getByLabelText('Open action Interview Prep')).toBeTruthy()

    act(() => {
      useJobTrackerStore.getState().updateJobAction('4', 'Send Thank You', 'Tomorrow')
    })

    expect(getByText('COMPLETED')).toBeTruthy()
    expect(getByText('Interview Prep')).toBeTruthy()
    expect(queryByLabelText('Open action Interview Prep')).toBeNull()
    expect(getByLabelText('Open action Send Thank You')).toBeTruthy()
  })

  it('marks offer task completed and loads onboarding task', () => {
    const { getByText, getByLabelText, queryByLabelText } = render(<WeeklyDigestScreen />)
    expect(getByLabelText('Open action Sign Offer Letter')).toBeTruthy()

    act(() => {
      useJobTrackerStore.getState().updateJobStatus('5', 'Offer Signed')
      useJobTrackerStore.getState().updateJobAction('5', 'Prepare for onboarding', 'Next Week')
    })

    expect(getByText('COMPLETED')).toBeTruthy()
    expect(getByText('Sign Offer Letter')).toBeTruthy()
    expect(queryByLabelText('Open action Sign Offer Letter')).toBeNull()
    expect(getByLabelText('Open action Prepare for onboarding')).toBeTruthy()
  })

  it('uses decision drawer for follow-up actions and applies no-response branch', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Follow up', 'in 3 days')
    })

    const { getByLabelText, getByText, queryByText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Mark action Follow up done'))

    expect(getByText('Did They Respond?')).toBeTruthy()
    fireEvent.press(getByText('No response yet'))

    const updated = useJobTrackerStore.getState().nextUp.find(job => job.id === '3')
    expect(updated?.nextAction).toBe('Send second follow-up')
    expect(getByText('Follow up')).toBeTruthy()
    expect(queryByText('Did They Respond?')).toBeNull()
  })

  it('uses decision drawer for offer actions and supports reject branch', () => {
    const { getByLabelText, getByText, queryByText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Mark action Sign Offer Letter done'))

    expect(getByText('Offer Decision')).toBeTruthy()
    fireEvent.press(getByText('Rejected'))

    const updated = useJobTrackerStore.getState().nextUp.find(job => job.id === '5')
    expect(updated?.status).toBe('Rejected')
    expect(updated?.nextAction).toBe('Continue search')
    expect(queryByText('Offer Decision')).toBeNull()
  })

  it('uses coffee chat completion drawer and updates follow-up action', () => {
    const { getByLabelText, getByText, queryByText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Mark action Coffee Chat w/ Recruiter done'))

    expect(getByText('Coffee Chat Completed?')).toBeTruthy()
    fireEvent.press(getByText('Not yet'))

    const updated = useJobTrackerStore.getState().nextUp.find(job => job.id === '4')
    expect(updated?.nextAction).toBe('Reschedule coffee chat')
    expect(queryByText('Coffee Chat Completed?')).toBeNull()
  })

  it('routes send-thank-you actions to outreach center', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('4', 'Send Thank You', 'Tomorrow')
    })

    const { getByLabelText } = render(<WeeklyDigestScreen />)
    fireEvent.press(getByLabelText('Open action Send Thank You'))

    expect(mockNavigate).toHaveBeenCalledWith(
      'OutreachCenter',
      expect.objectContaining({
        job: expect.objectContaining({ id: '4' }),
      })
    )
  })

  it('routes send-thankyou actions to outreach center', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('4', 'Send Thankyou', 'Tomorrow')
    })

    const { getByLabelText } = render(<WeeklyDigestScreen />)
    fireEvent.press(getByLabelText('Open action Send Thankyou'))

    expect(mockNavigate).toHaveBeenCalledWith(
      'OutreachCenter',
      expect.objectContaining({
        job: expect.objectContaining({ id: '4' }),
      })
    )
  })

  it('allows unchecking completed actions to return them to active list', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', '', '')
      useJobTrackerStore.getState().updateJobAction('4', '', '')
      useJobTrackerStore.getState().updateJobAction('5', '', '')
    })

    const { getByLabelText, getByText, queryByLabelText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Mark action Boost Outreach Volume done'))
    expect(getByText('COMPLETED')).toBeTruthy()
    expect(queryByLabelText('Open action Boost Outreach Volume')).toBeNull()

    fireEvent.press(getByLabelText('Uncheck action Boost Outreach Volume'))
    expect(getByLabelText('Open action Boost Outreach Volume')).toBeTruthy()
  })

  it('restores tracked submit action when unchecked', () => {
    const { getByLabelText, getByText, queryByLabelText } = render(<WeeklyDigestScreen />)

    fireEvent.press(getByLabelText('Mark action Submit Application done'))
    fireEvent.press(getByText('Yes, submitted'))

    expect(queryByLabelText('Open action Submit Application')).toBeNull()

    fireEvent.press(getByLabelText('Uncheck action Submit Application'))
    expect(getByLabelText('Open action Submit Application')).toBeTruthy()

    const restored = useJobTrackerStore.getState().nextUp.find(job => job.id === '3')
    expect(restored?.status).toBe('Target')
    expect(restored?.nextAction).toBe('Submit Application')
  })
})
