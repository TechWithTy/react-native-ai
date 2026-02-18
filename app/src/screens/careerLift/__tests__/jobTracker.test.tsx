import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { JobTrackerScreen } from '../jobTracker'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'
import { useUserProfileStore } from '../../../store/userProfileStore'
import { useCareerSetupStore } from '../../../store/careerSetup'

// --- Mocks ---

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useFocusEffect: (cb: () => void) => {},
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}))

jest.spyOn(Alert, 'alert')

describe('JobTrackerScreen — Core Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the header with title and active job count', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('My Pipeline')).toBeTruthy()
    // thisWeek (2) + nextUp (3) = 5 active
    expect(getByText('5 active')).toBeTruthy()
  })

  it('renders all four stats cards with correct labels', () => {
    const { getAllByText } = render(<JobTrackerScreen />)

    // "Applied" appears in stat card label + job badge(s)
    expect(getAllByText('Applied').length).toBeGreaterThanOrEqual(1)
    // "Interviewing" is now the label for the stat card
    expect(getAllByText('Interviewing').length).toBeGreaterThanOrEqual(1)
    // "Interview" still appears in job card badge (Google)
    expect(getAllByText('Interview').length).toBeGreaterThanOrEqual(1)
    // "Offers" only appears in the stat card label
    expect(getAllByText('Offers').length).toBe(1)
    // "Saved" appears in stat card + Target job badges are rendered as "Saved"
    expect(getAllByText('Saved').length).toBeGreaterThanOrEqual(1)
  })

  it('renders stat card counts correctly', () => {
    const { getAllByText } = render(<JobTrackerScreen />)
    // Applied = 1 (Stripe), Interview = 1 (Google), Offers = 1 (Spotify), Saved = 2 (Airbnb, Netflix)
    // Count '1' appears multiple times (Applied, Interview, Offers stats)
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(3)
    // Count '2' appears for Saved
    expect(getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "This Week" and "Next Up" sections when not filtering', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('This Week')).toBeTruthy()
    expect(getByText('Next Up')).toBeTruthy()
  })

  it('renders recommended jobs slider with company names', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('Recommended For You')).toBeTruthy()
    expect(getByText('See All')).toBeTruthy()
    expect(getByText('Stellar AI')).toBeTruthy()
    expect(getByText('FinFlow')).toBeTruthy()
    expect(getByText('Nexus Systems')).toBeTruthy()
  })

  it('renders job cards with role and status info', () => {
    const { getByText, getAllByText } = render(<JobTrackerScreen />)

    expect(getByText('Senior UX Engineer')).toBeTruthy()
    expect(getByText('Staff Product Designer')).toBeTruthy()
    expect(getByText('Design Lead')).toBeTruthy()
    expect(getByText('Product Designer')).toBeTruthy()
    expect(getAllByText(/Google/).length).toBeGreaterThanOrEqual(1)
    expect(getAllByText(/Stripe/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows overdue styling for overdue jobs', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('Overdue')).toBeTruthy()
  })

  it('renders offer card with special badge text', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('Offer Received')).toBeTruthy()
  })

  it('renders search input with correct placeholder', () => {
    const { getByPlaceholderText } = render(<JobTrackerScreen />)
    expect(getByPlaceholderText('Search pipeline...')).toBeTruthy()
  })

  it('renders filter chips including "All Roles"', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('All Roles')).toBeTruthy()
  })
})

describe('JobTrackerScreen — Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to RecommendedJobs on "See All" press', () => {
    const { getByText } = render(<JobTrackerScreen />)
    fireEvent.press(getByText('See All'))
    expect(mockNavigate).toHaveBeenCalledWith('RecommendedJobs')
  })
})

describe('JobTrackerScreen — Custom Interview Prep Surface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useUserProfileStore.getState().resetProfile()
  })

  it('always renders Start Custom Interview Prep button', () => {
    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('Custom Interview Prep')).toBeTruthy()
    expect(getByText('Start Custom Interview Prep')).toBeTruthy()
  })

  it('keeps Start Custom Interview Prep visible when saved preps exist', () => {
    useUserProfileStore.getState().saveCustomInterviewPrep({
      inferredRole: 'Staff Data Scientist',
      roleTrack: 'Data',
      companyName: 'Northwind',
      sourceType: 'url',
      sourcePreview: 'https://northwind.dev/jobs/staff-data-scientist',
      focusAreas: ['ML Systems'],
      generatedAt: new Date().toISOString(),
    })

    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('Start Custom Interview Prep')).toBeTruthy()
    expect(getByText('Staff Data Scientist')).toBeTruthy()
  })

  it('navigates to profile custom-prep entry flow when start button is pressed', () => {
    const { getByText } = render(<JobTrackerScreen />)
    fireEvent.press(getByText('Start Custom Interview Prep'))

    expect(mockNavigate).toHaveBeenCalledWith(
      'SettingsProfile',
      expect.objectContaining({ openCustomPrepAt: expect.any(Number) })
    )
  })

  it('shows saved custom preps in tracker and opens one in InterviewPrep', () => {
    useUserProfileStore.getState().saveCustomInterviewPrep({
      inferredRole: 'Data Scientist',
      roleTrack: 'Engineering',
      companyName: 'DataCo',
      sourceType: 'text',
      sourcePreview: 'JD text',
      focusAreas: ['ML Modeling'],
      generatedAt: new Date().toISOString(),
    })

    const { getByText, queryByText } = render(<JobTrackerScreen />)

    expect(getByText('Data Scientist')).toBeTruthy()
    expect(getByText(/DataCo/)).toBeTruthy()
    expect(queryByText(/No custom preps yet/)).toBeNull()

    fireEvent.press(getByText('Data Scientist'))
    expect(mockNavigate).toHaveBeenCalledWith(
      'InterviewPrep',
      expect.objectContaining({
        customPrep: expect.objectContaining({
          inferredRole: 'Data Scientist',
        }),
      })
    )
  })
})

describe('JobTrackerScreen — Stats Card Interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('toggles Applied filter and hides default sections', () => {
    const { getAllByText, queryByText, getByText } = render(<JobTrackerScreen />)

    // Press first "Applied" text (stat card)
    fireEvent.press(getAllByText('Applied')[0])

    // Should show filtered section title
    expect(getByText('Applied Jobs')).toBeTruthy()
    expect(queryByText('This Week')).toBeNull()
    expect(queryByText('Next Up')).toBeNull()
  })

  it('toggles Interview filter and shows "Interviews" section', () => {
    const { getAllByText, queryByText, getByText } = render(<JobTrackerScreen />)

    fireEvent.press(getAllByText('Interviewing')[0])
    expect(getByText('Interviews')).toBeTruthy()
    expect(queryByText('This Week')).toBeNull()
  })

  it('toggles Offers filter', () => {
    const { getAllByText, queryByText } = render(<JobTrackerScreen />)
    // "Offers" appears once in the stat card label initially
    fireEvent.press(getAllByText('Offers')[0])
    // After pressing, both stat label and section title show "Offers"
    expect(getAllByText('Offers').length).toBeGreaterThanOrEqual(1)
    expect(queryByText('This Week')).toBeNull()
  })

  it('toggles Saved filter and shows "Saved Jobs" section', () => {
    const { getAllByText, getByText } = render(<JobTrackerScreen />)
    fireEvent.press(getAllByText('Saved')[0])
    expect(getByText('Saved Jobs')).toBeTruthy()
  })

  it('double-pressing same stat card resets to "All" view', () => {
    const { getAllByText, queryByText, getByText } = render(<JobTrackerScreen />)

    // Press Applied → filtered
    fireEvent.press(getAllByText('Applied')[0])
    expect(queryByText('This Week')).toBeNull()

    // Press Applied again → unfiltered
    fireEvent.press(getAllByText('Applied')[0])
    expect(getByText('This Week')).toBeTruthy()
    expect(getByText('Next Up')).toBeTruthy()
  })
})
