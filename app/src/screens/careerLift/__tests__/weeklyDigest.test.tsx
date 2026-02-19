import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
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
})
