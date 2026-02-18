import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { RecommendedJobsScreen } from '../recommendedJobs'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}))

describe('RecommendedJobsScreen — E2E behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useJobTrackerStore.getState().resetJobTrackerStore()
  })

  it('shows filter badges that match live recommended results and updates with search', () => {
    const { getByPlaceholderText, getByText } = render(<RecommendedJobsScreen />)

    expect(getByText('All Matches (4)')).toBeTruthy()
    expect(getByText('Remote (3)')).toBeTruthy()
    expect(getByText('Full-time (3)')).toBeTruthy()
    expect(getByText('Product Design (3)')).toBeTruthy()

    fireEvent.changeText(getByPlaceholderText('Search job titles, companies...'), 'FinFlow')

    expect(getByText('All Matches (1)')).toBeTruthy()
    expect(getByText('Remote (0)')).toBeTruthy()
    expect(getByText('Full-time (1)')).toBeTruthy()
    expect(getByText('Product Design (0)')).toBeTruthy()
  })

  it('opens and closes the same notifications modal used on Home', () => {
    const { getByLabelText, getByText, queryByText } = render(<RecommendedJobsScreen />)

    fireEvent.press(getByLabelText('Open notifications'))

    expect(getByText('Notifications')).toBeTruthy()
    expect(getByText('Urgent')).toBeTruthy()
    expect(getByText('Interview starts in 45 min')).toBeTruthy()
    expect(getByText('Weekly scan completed')).toBeTruthy()

    fireEvent.press(getByLabelText('Close notifications'))
    expect(queryByText('Notifications')).toBeNull()
  })

  it('saves filter preset to state, uses it for scan, and can reset it', () => {
    const { getByLabelText, getByText, getByPlaceholderText } = render(<RecommendedJobsScreen />)

    fireEvent.press(getByLabelText('Open job filters'))
    fireEvent.press(getByText('Remote only'))
    fireEvent.press(getByText('Full-time only'))
    fireEvent.changeText(getByPlaceholderText('City, State or Remote'), 'Austin')
    fireEvent.press(getByText('Austin, TX'))
    fireEvent.changeText(getByPlaceholderText('e.g. Remote PM Roles'), 'Austin Remote Focus')
    fireEvent.press(getByLabelText('Save recommended filters'))

    let preset = useJobTrackerStore.getState().recommendedScanPreset
    expect(preset).toEqual(
      expect.objectContaining({
        remoteOnly: true,
        fullTimeOnly: true,
        locationQuery: 'Austin, TX',
        name: 'Austin Remote Focus',
        label: 'Remote • Full-time • Austin, TX',
      })
    )

    fireEvent.press(getByLabelText('Use filters in scan'))
    expect(mockNavigate).toHaveBeenCalledWith('Dashboard', { startScanFromSavedFilters: true })

    fireEvent.press(getByLabelText('Open job filters'))
    fireEvent.press(getByText('Reset'))

    preset = useJobTrackerStore.getState().recommendedScanPreset
    expect(preset).toBeNull()
  })
})
