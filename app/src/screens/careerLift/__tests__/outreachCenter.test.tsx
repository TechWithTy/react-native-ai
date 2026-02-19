import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
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
})
