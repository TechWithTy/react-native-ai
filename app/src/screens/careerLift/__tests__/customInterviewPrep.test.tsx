import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { InterviewPrepScreen } from '../interviewPrep'
import { useCreditsStore } from '../../../store/creditsStore'
import { useUserProfileStore } from '../../../store/userProfileStore'
import { CustomInterviewPrepPayload } from '../../../../types'

// --- Test Fixtures ---

const MOCK_CUSTOM_PREP: CustomInterviewPrepPayload = {
  inferredRole: 'Senior Product Manager',
  roleTrack: 'Product',
  companyName: 'Acme Corp',
  sourceType: 'url',
  sourcePreview: 'https://acme.com/jobs/senior-pm',
  focusAreas: ['Stakeholder Management', 'Product Strategy', 'Data-Driven Decisions'],
  generatedAt: '2026-02-17T20:00:00.000Z',
}

// --- Mocks ---

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

let mockRouteParams: any = {}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}))

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}))

// SubscriptionModal is a heavy component — stub it
jest.mock('../subscriptionModal', () => ({
  SubscriptionModal: () => null,
}))

jest.spyOn(Alert, 'alert')

// --- Helpers ---

function resetStores() {
  useCreditsStore.getState().resetCredits()
  useUserProfileStore.getState().resetProfile()
}

// --- Test Suites ---

describe('InterviewPrepScreen — Default Flow (no customPrep)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = {}
    resetStores()
  })

  it('renders normal Interview Prep header and score', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Interview Prep')).toBeTruthy()
    expect(getByText('Senior Product Manager')).toBeTruthy()
    expect(getByText('65%')).toBeTruthy()
    expect(getByText(/on track for your interview/)).toBeTruthy()
  })

  it('renders base Preparation Tools label', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Preparation Tools')).toBeTruthy()
  })

  it('renders Start Mock Interview button', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Start Mock Interview')).toBeTruthy()
  })

  it('navigates to MockInterview without params in default flow', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    fireEvent.press(getByText('Start Mock Interview'))
    expect(mockNavigate).toHaveBeenCalledWith('MockInterview')
  })

  it('does NOT render custom flow card in default flow', () => {
    const { queryByText } = render(<InterviewPrepScreen />)
    expect(queryByText('Custom Prep Flow')).toBeNull()
    expect(queryByText('Continue Custom Prep')).toBeNull()
  })

  it('displays credit balance and cost info', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText(/credits available/)).toBeTruthy()
    expect(getByText(/~15 credits/)).toBeTruthy()
  })
})

describe('InterviewPrepScreen — Custom Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = { customPrep: MOCK_CUSTOM_PREP }
    resetStores()
  })

  it('renders custom header and role', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Custom Interview Prep')).toBeTruthy()
    expect(getByText('Senior Product Manager')).toBeTruthy()
  })

  it('renders custom hero text with company name', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText(/Built for Acme Corp/)).toBeTruthy()
  })

  it('calculates custom readiness score based on focus areas', () => {
    // 58 + 3 focus areas * 8 = 82
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('82%')).toBeTruthy()
  })

  it('renders readiness score capped at 90 with many focus areas', () => {
    const manyAreas = {
      ...MOCK_CUSTOM_PREP,
      focusAreas: ['A', 'B', 'C', 'D', 'E', 'F'],
    }
    mockRouteParams = { customPrep: manyAreas }
    const { getByText } = render(<InterviewPrepScreen />)
    // 58 + 6*8 = 106 → capped at 90
    expect(getByText('90%')).toBeTruthy()
  })

  it('renders Custom Prep Flow card with step indicators', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Custom Prep Flow')).toBeTruthy()
    expect(getByText('Step 1/3')).toBeTruthy()
    expect(getByText('Role Snapshot')).toBeTruthy()
    expect(getByText('Focus Areas')).toBeTruthy()
    expect(getByText('Question Drill')).toBeTruthy()
  })

  it('renders focus area chips', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Stakeholder Management')).toBeTruthy()
    expect(getByText('Product Strategy')).toBeTruthy()
    expect(getByText('Data-Driven Decisions')).toBeTruthy()
  })

  it('renders generated opener question', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText(/Tell me about a time you showed strong stakeholder management/)).toBeTruthy()
  })

  it('displays custom subtitle with company and role', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Senior Product Manager at Acme Corp')).toBeTruthy()
  })

  it('renders custom mock interview button text', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Start Custom Mock Interview')).toBeTruthy()
    expect(getByText(/Practice with questions generated from this job description/)).toBeTruthy()
  })

  it('renders Base Preparation Tools label in custom mode', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Base Preparation Tools')).toBeTruthy()
  })

  it('renders Continue Custom Prep button initially', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Continue Custom Prep')).toBeTruthy()
  })
})

describe('InterviewPrepScreen — Custom Flow Step Advancement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = { customPrep: MOCK_CUSTOM_PREP }
    resetStores()
  })

  it('advances through custom flow steps on button press', () => {
    const { getByText } = render(<InterviewPrepScreen />)

    // Step 1/3
    expect(getByText('Step 1/3')).toBeTruthy()
    expect(getByText('Continue Custom Prep')).toBeTruthy()

    // Advance to step 2
    fireEvent.press(getByText('Continue Custom Prep'))
    expect(getByText('Step 2/3')).toBeTruthy()

    // Advance to step 3
    fireEvent.press(getByText('Continue Custom Prep'))
    expect(getByText('Step 3/3')).toBeTruthy()
    // At final step, button text changes
    expect(getByText('Finish & Save To Profile')).toBeTruthy()
  })

  it('saves to profile on final step press and shows alert', () => {
    const { getByText } = render(<InterviewPrepScreen />)

    // Advance to final step
    fireEvent.press(getByText('Continue Custom Prep')) // -> step 2
    fireEvent.press(getByText('Continue Custom Prep')) // -> step 3

    // Press finish
    fireEvent.press(getByText('Finish & Save To Profile'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Saved To Profile',
      expect.stringContaining('Senior Product Manager')
    )

    // Button should change to "Saved To Profile"
    expect(getByText('Saved To Profile')).toBeTruthy()
    expect(getByText('Saved')).toBeTruthy() // badge text
  })

  it('actually persists the custom prep to the user profile store', () => {
    const { getByText } = render(<InterviewPrepScreen />)

    // Advance and save
    fireEvent.press(getByText('Continue Custom Prep'))
    fireEvent.press(getByText('Continue Custom Prep'))
    fireEvent.press(getByText('Finish & Save To Profile'))

    const { customInterviewPreps } = useUserProfileStore.getState()
    expect(customInterviewPreps.length).toBe(1)
    expect(customInterviewPreps[0].inferredRole).toBe('Senior Product Manager')
    expect(customInterviewPreps[0].companyName).toBe('Acme Corp')
    expect(customInterviewPreps[0].focusAreas).toEqual([
      'Stakeholder Management',
      'Product Strategy',
      'Data-Driven Decisions',
    ])
    expect(customInterviewPreps[0].id).toMatch(/^custom-prep-/)
    expect(customInterviewPreps[0].savedAt).toBeTruthy()
  })

  it('does not double-save on repeated presses after saving', () => {
    const { getByText } = render(<InterviewPrepScreen />)

    fireEvent.press(getByText('Continue Custom Prep'))
    fireEvent.press(getByText('Continue Custom Prep'))
    fireEvent.press(getByText('Finish & Save To Profile'))
    fireEvent.press(getByText('Saved To Profile')) // press again

    // Alert only called once
    expect(Alert.alert).toHaveBeenCalledTimes(1)
    // Store still has exactly 1 entry
    expect(useUserProfileStore.getState().customInterviewPreps.length).toBe(1)
  })
})

describe('InterviewPrepScreen — Custom Mock Interview Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = { customPrep: MOCK_CUSTOM_PREP }
    resetStores()
  })

  it('navigates to MockInterview with custom question and category', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    fireEvent.press(getByText('Start Custom Mock Interview'))
    expect(mockNavigate).toHaveBeenCalledWith('MockInterview', {
      question: 'Tell me about a time you showed strong stakeholder management.',
      category: 'Senior Product Manager',
    })
  })

  it('uses fallback question when no focus areas exist', () => {
    const noFocusPrep = { ...MOCK_CUSTOM_PREP, focusAreas: [] }
    mockRouteParams = { customPrep: noFocusPrep }

    const { getByText } = render(<InterviewPrepScreen />)
    fireEvent.press(getByText('Start Custom Mock Interview'))
    expect(mockNavigate).toHaveBeenCalledWith('MockInterview', {
      question: expect.stringContaining('strong fit for this Senior Product Manager role'),
      category: 'Senior Product Manager',
    })
  })
})

describe('InterviewPrepScreen — Custom Flow with no company', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = {
      customPrep: { ...MOCK_CUSTOM_PREP, companyName: null },
    }
    resetStores()
  })

  it('renders hero text with fallback company text', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText(/Built for your target company/)).toBeTruthy()
  })

  it('renders subtitle without company', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Senior Product Manager role focus')).toBeTruthy()
  })
})

describe('InterviewPrepScreen — Credits integration in custom flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = { customPrep: MOCK_CUSTOM_PREP }
    resetStores()
  })

  it('shows credit info in custom flow', () => {
    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText(/credits available/)).toBeTruthy()
    expect(getByText(/~15 credits/)).toBeTruthy()
  })

  it('shows insufficient credits warning when balance is low', () => {
    // Spend most credits
    const store = useCreditsStore.getState()
    while (useCreditsStore.getState().balance >= 15) {
      useCreditsStore.getState().spendCredits('mockInterview')
    }

    const { getByText } = render(<InterviewPrepScreen />)
    expect(getByText('Insufficient credits for this action')).toBeTruthy()
  })
})
