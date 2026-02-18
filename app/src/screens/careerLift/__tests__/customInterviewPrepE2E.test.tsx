import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { SettingsProfileScreen } from '../settingsProfile'
import { InterviewPrepScreen } from '../interviewPrep'
import { JobTrackerScreen } from '../jobTracker'
import { useCareerSetupStore } from '../../../store/careerSetup'
import { useCreditsStore } from '../../../store/creditsStore'
import { useUserProfileStore } from '../../../store/userProfileStore'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
let mockRouteParams: any = {}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    getState: () => ({ routeNames: ['SettingsProfile', 'InterviewPrep', 'JobTracker'] }),
    getParent: () => null,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
  useFocusEffect: () => {},
}))

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  FontAwesome5: 'FontAwesome5',
  Ionicons: 'Ionicons',
  Feather: 'Feather',
}))

jest.mock('../subscriptionModal', () => ({
  SubscriptionModal: () => null,
}))

jest.spyOn(Alert, 'alert')

function resetStores() {
  useCreditsStore.getState().resetCredits()
  useUserProfileStore.getState().resetProfile()
  useCareerSetupStore.getState().resetCareerSetup()
}

describe('Custom Interview Prep E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    resetStores()
    mockRouteParams = {}
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('processes custom prep, saves it, and surfaces it in tracker', async () => {
    const settings = render(<SettingsProfileScreen />)

    fireEvent.press(settings.getByText('Custom Interview Prep'))
    fireEvent.changeText(
      settings.getByPlaceholderText('https://company.com/jobs/senior-pm'),
      'https://acme.com/jobs/staff-product-designer'
    )

    await act(async () => {
      fireEvent.press(settings.getByText('Update'))
    })

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        jest.advanceTimersByTime(900)
      })
    }

    await act(async () => {
      jest.advanceTimersByTime(700)
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      'InterviewPrep',
      expect.objectContaining({
        customPrep: expect.objectContaining({
          sourceType: 'url',
          inferredRole: expect.any(String),
        }),
      })
    )

    const interviewPrepCall = mockNavigate.mock.calls.find(call => call[0] === 'InterviewPrep')
    const customPrep = interviewPrepCall?.[1]?.customPrep
    expect(customPrep).toBeTruthy()

    settings.unmount()

    mockRouteParams = { customPrep }
    const prep = render(<InterviewPrepScreen />)
    expect(prep.getByText('Custom Interview Prep')).toBeTruthy()

    fireEvent.press(prep.getByText('Continue Custom Prep'))
    fireEvent.press(prep.getByText('Continue Custom Prep'))
    fireEvent.press(prep.getByText('Finish & Save To Profile'))

    expect(useUserProfileStore.getState().customInterviewPreps.length).toBe(1)

    prep.unmount()

    const tracker = render(<JobTrackerScreen />)
    expect(tracker.getByText('Start Custom Interview Prep')).toBeTruthy()
    expect(tracker.getByText(/Acme/)).toBeTruthy()
  })
})
