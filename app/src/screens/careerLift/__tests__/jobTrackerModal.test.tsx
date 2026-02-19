import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { JobTrackerScreen } from '../jobTracker'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'

// --- Mocks ---

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockClipboardSetStringAsync = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useFocusEffect: (cb: () => void) => {},
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text: RNText } = require('react-native')
  return {
    MaterialIcons: (props: any) =>
      React.createElement(RNText, { testID: `icon-mi-${props.name}` }, props.name),
    Feather: (props: any) =>
      React.createElement(RNText, { testID: `icon-fe-${props.name}` }, props.name),
  }
})

jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: any[]) => mockClipboardSetStringAsync(...args),
}))

jest.spyOn(Alert, 'alert')

describe('JobTrackerScreen — Job Detail Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockClipboardSetStringAsync.mockClear()
    useJobTrackerStore.getState().resetJobTrackerStore()
  })

  it('opens modal with job header on card press', () => {
    const { getByText } = render(<JobTrackerScreen />)

    // Press on Google job
    fireEvent.press(getByText('Senior UX Engineer'))

    // Modal should open
    expect(getByText('Job Details')).toBeTruthy()
  })

  it('opens outreach drawer for follow-up action jobs', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Staff Product Designer'))

    expect(getByText('Draft Outreach Message')).toBeTruthy()
    expect(getAllByText('Follow up email').length).toBeGreaterThanOrEqual(1)
  })

  it('opens decision drawer for check-response jobs', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Check response', 'in 2 days')
    })

    const { getByText, queryByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Design Lead'))

    expect(getByText('Did They Respond?')).toBeTruthy()
    expect(queryByText('Draft Outreach Message')).toBeNull()
  })

  it('opens coffee-chat completion drawer instead of outreach draft', () => {
    const { getAllByText, getByText, queryByText } = render(<JobTrackerScreen />)

    const roleRows = getAllByText('Senior Product Designer')
    fireEvent.press(roleRows[roleRows.length - 1])

    expect(getByText('Coffee Chat Completed?')).toBeTruthy()
    expect(queryByText('Draft Outreach Message')).toBeNull()
  })

  it('opens outreach draft drawer for send-thank-you actions', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Send Thank You', 'Tomorrow')
    })

    const { getByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Design Lead'))

    expect(getByText('Draft Outreach Message')).toBeTruthy()
  })

  it('opens outreach draft drawer for send-thankyou actions', () => {
    act(() => {
      useJobTrackerStore.getState().updateJobAction('3', 'Send Thankyou', 'Tomorrow')
    })

    const { getByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Design Lead'))

    expect(getByText('Draft Outreach Message')).toBeTruthy()
  })

  it('shows next action info and notes inside job details modal', () => {
    const { getByText, getByPlaceholderText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Senior UX Engineer'))

    expect(getByText('Next Action')).toBeTruthy()
    expect(getByText('Notes')).toBeTruthy()
    expect(getByPlaceholderText('Add notes...')).toBeTruthy()
  })

  it('closes modal on X button press', () => {
    const { getByText, queryByText, getAllByTestId } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Senior UX Engineer'))
    expect(getByText('Job Details')).toBeTruthy()

    // Close button uses Feather icon "x" — find by testID
    const closeIcons = getAllByTestId('icon-fe-x')
    // Press the one in the modal header (last one or first — there should be only one)
    fireEvent.press(closeIcons[0])

    expect(queryByText('Job Details')).toBeNull()
  })

  it('generates and copies outreach draft from drawer', () => {
    const { getByText, getByTestId, getByDisplayValue } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Staff Product Designer'))
    fireEvent.press(getByTestId('tracker-outreach-generate'))

    expect(getByDisplayValue(/Quick follow-up on my application/i)).toBeTruthy()

    fireEvent.press(getByTestId('tracker-outreach-copy'))
    expect(mockClipboardSetStringAsync).toHaveBeenCalledWith(expect.stringContaining('Quick follow-up'))
  })

  it('marks outreach task sent, advances next action, and routes to OutreachCenter', () => {
    const { getByText, getByTestId } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Staff Product Designer'))
    fireEvent.press(getByTestId('tracker-outreach-mark-sent'))

    const updatedJob = useJobTrackerStore.getState().thisWeek.find(job => job.id === '2')
    expect(updatedJob?.nextAction).toBe('Check response')
    expect(updatedJob?.nextActionDate).toBe('in 2 days')
    expect(updatedJob?.notes).toContain('[Outreach sent')
    expect(mockNavigate).toHaveBeenCalledWith('OutreachCenter')
  })

  it('shows Submit Application for Target status jobs', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    // Airbnb is Target status
    fireEvent.press(getByText('Design Lead'))

    // "Submit Application" appears on the card (as nextAction render) + modal button
    expect(getAllByText('Submit Application').length).toBeGreaterThanOrEqual(1)
  })

  it('shows Practice Interview for Interview status jobs', () => {
    const { getByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Senior UX Engineer'))
    expect(getByText('Practice Interview')).toBeTruthy()
  })

  it('navigates to InterviewPrep on Practice Interview press', () => {
    const { getByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Senior UX Engineer'))
    fireEvent.press(getByText('Practice Interview'))

    expect(mockNavigate).toHaveBeenCalledWith(
      'InterviewPrep',
      expect.objectContaining({ job: expect.any(Object) })
    )
  })

  it('shows Offer celebration for Offer Received status', () => {
    const { getByText } = render(<JobTrackerScreen />)

    // Spotify — Offer Received
    fireEvent.press(getByText('Product Designer'))
    expect(getByText('🎉 Offer Received!')).toBeTruthy()
  })
})

describe('JobTrackerScreen — Update Status Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useJobTrackerStore.getState().resetJobTrackerStore()
  })

  it('opens update status view with status options', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    // Google — Interview
    fireEvent.press(getByText('Senior UX Engineer'))

    // "Update Status" may appear in card context + modal. Press last (modal)
    const updateBtns = getAllByText('Update Status')
    fireEvent.press(updateBtns[updateBtns.length - 1])

    // Status options (not including current "Interview")
    expect(getAllByText('Applied').length).toBeGreaterThanOrEqual(1)
    // "Interviewing" should be an option if not already in that status
    expect(getAllByText('Interviewing').length).toBeGreaterThanOrEqual(1)
    // 'Offer Received' may appear in background card + status option
    expect(getAllByText('Offer Received').length).toBeGreaterThanOrEqual(1)
    expect(getByText('Rejected')).toBeTruthy()
    expect(getByText('Not Interested')).toBeTruthy()
  })

  it('selecting a status shows check icon', () => {
    const { getByText, getAllByText, getAllByTestId } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Senior UX Engineer'))
    const updateBtns = getAllByText('Update Status')
    fireEvent.press(updateBtns[updateBtns.length - 1])

    // Select "Offer Received" — use last occurrence (in modal, not background card)
    const offerItems = getAllByText('Offer Received')
    fireEvent.press(offerItems[offerItems.length - 1])

    // Check icon should appear
    expect(getAllByTestId('icon-fe-check').length).toBeGreaterThanOrEqual(1)
  })

  it('shows reason input when Rejected is selected', () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Senior UX Engineer'))
    const updateBtns = getAllByText('Update Status')
    fireEvent.press(updateBtns[updateBtns.length - 1])

    fireEvent.press(getByText('Rejected'))

    expect(getByText('Reason (Optional)')).toBeTruthy()
    expect(
      getByPlaceholderText('Why was it rejected? (e.g. Salary, Role fit)')
    ).toBeTruthy()
  })

  it('shows reason input when Not Interested is selected', () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Senior UX Engineer'))
    const updateBtns = getAllByText('Update Status')
    fireEvent.press(updateBtns[updateBtns.length - 1])

    fireEvent.press(getByText('Not Interested'))

    expect(getByText('Why not interested?')).toBeTruthy()
    expect(getByPlaceholderText('Share your reason...')).toBeTruthy()
  })

  it('saves status update and closes modal', () => {
    const { getByText, getAllByText, getByPlaceholderText, queryByText } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Senior UX Engineer'))
    const updateBtns = getAllByText('Update Status')
    fireEvent.press(updateBtns[updateBtns.length - 1])

    const offerItems = getAllByText('Offer Received')
    fireEvent.press(offerItems[offerItems.length - 1])
    fireEvent.changeText(
      getByPlaceholderText('Add a quick update note for this status change...'),
      'Completed recruiter follow-up call and shared portfolio.'
    )
    fireEvent.press(getByText('Save Update'))

    expect(queryByText('Job Details')).toBeNull()

    // Verify store was updated
    const state = useJobTrackerStore.getState()
    const google = state.thisWeek.find((j) => j.id === '1')
    expect(google?.status).toBe('Offer Received')
    expect(google?.notes).toContain('Status: Interview -> Offer Received')
    expect(google?.notes).toContain('Completed recruiter follow-up call and shared portfolio.')
  })

  it('cancel returns to detail view', () => {
    const { getByText, getAllByText, queryByText } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Senior UX Engineer'))
    const updateBtns = getAllByText('Update Status')
    fireEvent.press(updateBtns[updateBtns.length - 1])

    expect(getByText('Save Update')).toBeTruthy()

    fireEvent.press(getByText('Cancel'))

    expect(queryByText('Save Update')).toBeNull()
    expect(getByText('Job Details')).toBeTruthy()
  })
})

describe('JobTrackerScreen — Application Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useJobTrackerStore.getState().resetJobTrackerStore()
  })

  it('enters application prep view for Target jobs', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    // Airbnb — Target
    fireEvent.press(getByText('Design Lead'))

    const submitBtns = getAllByText('Submit Application')
    fireEvent.press(submitBtns[submitBtns.length - 1])

    expect(getByText('Prepare Application')).toBeTruthy()
    expect(getByText('Resume')).toBeTruthy()
    expect(getByText('Cover Letter')).toBeTruthy()
    expect(getByText('Hold to Apply with AI')).toBeTruthy()
  })

  it('shows default resume and cover letter selections', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Design Lead'))
    const submitBtns = getAllByText('Submit Application')
    fireEvent.press(submitBtns[submitBtns.length - 1])

    expect(getByText('Product Design V4')).toBeTruthy()
    expect(getByText('AI Generated Tailored')).toBeTruthy()
  })

  it('opens resume dropdown and selects alternative', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    fireEvent.press(getByText('Design Lead'))
    const submitBtns = getAllByText('Submit Application')
    fireEvent.press(submitBtns[submitBtns.length - 1])

    // Open resume dropdown
    fireEvent.press(getByText('Product Design V4'))
    expect(getByText('UX Engineer Specialist')).toBeTruthy()

    // Select
    fireEvent.press(getByText('UX Engineer Specialist'))
    expect(getByText('UX Engineer Specialist')).toBeTruthy()
  })

  it('cancel exits application prep view', () => {
    const { getByText, getAllByText, queryByText } = render(
      <JobTrackerScreen />
    )

    fireEvent.press(getByText('Design Lead'))
    const submitBtns = getAllByText('Submit Application')
    fireEvent.press(submitBtns[submitBtns.length - 1])

    expect(getByText('Prepare Application')).toBeTruthy()

    fireEvent.press(getByText('Cancel'))

    expect(queryByText('Prepare Application')).toBeNull()
    expect(getByText('Job Details')).toBeTruthy()
  })
})
