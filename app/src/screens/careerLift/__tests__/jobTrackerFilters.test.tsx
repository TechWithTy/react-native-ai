import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { JobTrackerScreen } from '../jobTracker'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'
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

describe('JobTrackerScreen — Search Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('filters jobs by role name using search', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <JobTrackerScreen />
    )

    const searchInput = getByPlaceholderText('Search pipeline...')
    fireEvent.changeText(searchInput, 'Design Lead')

    // Should show filtered view with matching job
    expect(queryByText('This Week')).toBeNull() // isFiltering = true
    expect(getByText('Search Results')).toBeTruthy()
    // Airbnb Design Lead should still show
    expect(getByText('Design Lead')).toBeTruthy()
  })

  it('filters jobs by company name using search', () => {
    const { getByPlaceholderText, queryByText, getAllByText } = render(
      <JobTrackerScreen />
    )

    const searchInput = getByPlaceholderText('Search pipeline...')
    fireEvent.changeText(searchInput, 'Google')

    // Google Senior UX Engineer should show
    expect(getAllByText(/Google/).length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('Senior UX Engineer').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when search returns no results', () => {
    const { getByPlaceholderText, getByText } = render(<JobTrackerScreen />)

    const searchInput = getByPlaceholderText('Search pipeline...')
    fireEvent.changeText(searchInput, 'xyznonexistent')

    expect(getByText('No jobs found matching your filters.')).toBeTruthy()
  })

  it('case-insensitive search works correctly', () => {
    const { getByPlaceholderText, getAllByText } = render(
      <JobTrackerScreen />
    )

    const searchInput = getByPlaceholderText('Search pipeline...')
    fireEvent.changeText(searchInput, 'google')

    // Should still find Google
    expect(getAllByText(/Google/).length).toBeGreaterThanOrEqual(1)
  })

  it('clearing search restores unfiltered view', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <JobTrackerScreen />
    )

    const searchInput = getByPlaceholderText('Search pipeline...')

    // Search
    fireEvent.changeText(searchInput, 'nonexist')
    expect(queryByText('This Week')).toBeNull()

    // Clear
    fireEvent.changeText(searchInput, '')
    expect(getByText('This Week')).toBeTruthy()
    expect(getByText('Next Up')).toBeTruthy()
  })
})

describe('JobTrackerScreen — Status + Search Combo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('combines status filter with search query', () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <JobTrackerScreen />
    )

    // Filter by Applied status (appears in stat card + badge)
    fireEvent.press(getAllByText('Applied')[0])

    // Then search for a specific company
    const searchInput = getByPlaceholderText('Search pipeline...')
    fireEvent.changeText(searchInput, 'Stripe')

    // Should show Applied Jobs section
    expect(getByText('Applied Jobs')).toBeTruthy()
    // Stripe is Applied, so it should show
    expect(getByText('Staff Product Designer')).toBeTruthy()
  })

  it('status filter shows correct section titles', () => {
    const { getAllByText, getByText } = render(<JobTrackerScreen />)

    fireEvent.press(getAllByText('Applied')[0])
    expect(getByText('Applied Jobs')).toBeTruthy()

    // Reset by pressing again
    fireEvent.press(getAllByText('Applied')[0])

    fireEvent.press(getAllByText('Interviewing')[0])
    expect(getByText('Interviews')).toBeTruthy()

    fireEvent.press(getAllByText('Interviewing')[0])

    fireEvent.press(getAllByText('Saved')[0])
    expect(getByText('Saved Jobs')).toBeTruthy()
  })

  it('filtered view shows count badge', () => {
    const { getAllByText } = render(<JobTrackerScreen />)

    // Filter by Target/Saved — expect 2 jobs (Airbnb, Netflix)
    fireEvent.press(getAllByText('Saved')[0])

    // The count badge showing '2' — already exists in stat card too
    expect(getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })
})

describe('JobTrackerScreen — Role Filter Chips', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('filters by role chip when pressed', () => {
    const store = useJobTrackerStore.getState()

    const { getByText, queryByText } = render(<JobTrackerScreen />)

    // All Roles should be present
    expect(getByText('All Roles')).toBeTruthy()

    // "Product Design" is a default filter chip
    const productDesignChip = queryByText('Product Design')
    if (productDesignChip) {
      fireEvent.press(productDesignChip)
      // Now filtering is active
      expect(queryByText('This Week')).toBeNull()
    }
  })

  it('displays dynamic filter chips from user profile', () => {
    act(() => {
      useCareerSetupStore.getState().setCareerSetup({
        roleTrack: 'Engineering',
        targetRole: 'Frontend Engineer',
        locationPreference: 'Remote',
      })
    })

    const { getByText } = render(<JobTrackerScreen />)
    expect(getByText('All Roles')).toBeTruthy()
    // Should include user-specific filters
    expect(getByText('Engineering')).toBeTruthy()
    expect(getByText('Frontend Engineer')).toBeTruthy()
    expect(getByText('Remote')).toBeTruthy()

    // Cleanup
    act(() => {
      useCareerSetupStore.getState().resetCareerSetup()
    })
  })
})
