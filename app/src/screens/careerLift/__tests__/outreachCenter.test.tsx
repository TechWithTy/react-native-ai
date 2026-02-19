import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { OutreachCenterScreen } from '../outreachCenter'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'
import { useCreditsStore } from '../../../store/creditsStore'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockSetParams = jest.fn()
let mockRouteParams: Record<string, unknown> = {}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setParams: mockSetParams,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}))

describe('OutreachCenterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = {}
    useJobTrackerStore.getState().resetJobTrackerStore()
    useCreditsStore.getState().resetCredits()
  })

  it('renders outreach jobs from the tracker store', () => {
    const { getByText } = render(<OutreachCenterScreen />)

    expect(getByText('Outreach Center')).toBeTruthy()
    expect(getByText('Staff Product Designer')).toBeTruthy()
    expect(getByText('Stripe')).toBeTruthy()
  })

  it('opens outreach drawer from a selected job row', () => {
    const { getByLabelText, getByText } = render(<OutreachCenterScreen />)

    fireEvent.press(getByLabelText('Open outreach drawer for Staff Product Designer at Stripe'))
    expect(getByText('Draft Outreach Message')).toBeTruthy()
    expect(getByText('Staff Product Designer • Stripe')).toBeTruthy()
  })

  it('auto-opens drawer when navigated with a jobId param', () => {
    mockRouteParams = { jobId: '2' }
    const { getByText } = render(<OutreachCenterScreen />)

    expect(getByText('Draft Outreach Message')).toBeTruthy()
    expect(getByText('Staff Product Designer • Stripe')).toBeTruthy()
    expect(mockSetParams).toHaveBeenCalledWith({ job: undefined, jobId: undefined })
  })

  it('includes generic follow-up tasks in outreach queue', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Follow up', 'in 3 days')
    })

    const { getByText } = render(<OutreachCenterScreen />)
    expect(getByText('Design Lead')).toBeTruthy()
    expect(getByText('Follow up • in 3 days')).toBeTruthy()
  })

  it('opens decision drawer for check-response actions instead of draft drawer', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Check response', 'in 2 days')
    })

    const { getByLabelText, getByText, queryByText } = render(<OutreachCenterScreen />)

    fireEvent.press(getByLabelText('Open outreach drawer for Design Lead at Airbnb'))

    expect(getByText('Did They Respond?')).toBeTruthy()
    expect(queryByText('Draft Outreach Message')).toBeNull()
  })

  it('opens coffee-chat completion drawer instead of draft drawer', () => {
    const { getByLabelText, getByText, queryByText } = render(<OutreachCenterScreen />)

    fireEvent.press(getByLabelText('Open outreach drawer for Senior Product Designer at Netflix'))

    expect(getByText('Coffee Chat Completed?')).toBeTruthy()
    expect(queryByText('Draft Outreach Message')).toBeNull()
  })

  it('marking outreach sent updates the job to check response', () => {
    mockRouteParams = { jobId: '2' }
    const { getByTestId } = render(<OutreachCenterScreen />)

    fireEvent.press(getByTestId('outreach-center-mark-sent'))

    const updatedJob =
      useJobTrackerStore.getState().thisWeek.find(job => job.id === '2') ||
      useJobTrackerStore.getState().nextUp.find(job => job.id === '2')

    expect(updatedJob?.nextAction).toBe('Check response')
    expect(updatedJob?.nextActionDate).toBe('in 2 days')
    expect(updatedJob?.notes).toContain('[Outreach sent')
  })

  it('marking thank-you outreach sent also advances to check response', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Send Thank You', 'Tomorrow')
    })

    mockRouteParams = { jobId: '3' }
    const { getByTestId } = render(<OutreachCenterScreen />)

    fireEvent.press(getByTestId('outreach-center-mark-sent'))

    const updatedJob = useJobTrackerStore.getState().nextUp.find(job => job.id === '3')
    expect(updatedJob?.nextAction).toBe('Check response')
    expect(updatedJob?.nextActionDate).toBe('in 2 days')
    expect(updatedJob?.notes).toContain('[Outreach sent')
  })
})
