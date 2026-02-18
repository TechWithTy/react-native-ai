import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { SettingsProfileScreen } from '../settingsProfile'
import { useCreditsStore } from '../../../store/creditsStore'
import { useUserProfileStore } from '../../../store/userProfileStore'
import { useCareerSetupStore } from '../../../store/careerSetup'

// --- Mocks ---

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockGetDocumentAsync = jest.fn()
const mockRequestForegroundPermissionsAsync = jest.fn()
const mockGetCurrentPositionAsync = jest.fn()
const mockReverseGeocodeAsync = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
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

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}))

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
  reverseGeocodeAsync: (...args: unknown[]) => mockReverseGeocodeAsync(...args),
}))

jest.mock('country-state-city', () => ({
  City: {
    getCitiesOfCountry: () => [
      { name: 'Austin', stateCode: 'TX' },
      { name: 'San Francisco', stateCode: 'CA' },
      { name: 'Seattle', stateCode: 'WA' },
    ],
  },
  State: {
    getStatesOfCountry: () => [
      { isoCode: 'TX', name: 'Texas' },
      { isoCode: 'CA', name: 'California' },
      { isoCode: 'WA', name: 'Washington' },
    ],
  },
}))

// Stub the SubscriptionModal
jest.mock('../subscriptionModal', () => {
  const { View } = require('react-native')
  return {
    SubscriptionModal: ({ visible }: { visible: boolean }) =>
      visible ? <View testID="subscription-modal" /> : null,
  }
})

jest.spyOn(Alert, 'alert')

// --- Helpers ---

function resetStores() {
  useCreditsStore.getState().resetCredits()
  useUserProfileStore.getState().resetProfile()
}

// --- Tests ---

describe('SettingsProfileScreen — AI Credits & Plans Section', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStores()
  })

  it('renders the AI CREDITS & PLANS section header', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('AI CREDITS & PLANS')).toBeTruthy()
  })

  it('displays current credit balance', () => {
    const { getByText, getAllByText } = render(<SettingsProfileScreen />)
    // Default balance is 150
    expect(getAllByText(/150/).length).toBeGreaterThan(0)
    expect(getAllByText(/credits/).length).toBeGreaterThan(0)
    expect(getByText('Available Credits')).toBeTruthy()
  })

  it('renders Add button for credits', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('Add')).toBeTruthy()
  })

  it('renders Buy Credit Packages row', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('Buy Credit Packages')).toBeTruthy()
    expect(getByText(/One-time packs starting at \$4\.99/)).toBeTruthy()
  })

  it('renders Upgrade Plan row with UPGRADE pill', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('Upgrade Plan')).toBeTruthy()
    expect(getByText('UPGRADE')).toBeTruthy()
    expect(getByText(/Unlock auto-apply/)).toBeTruthy()
  })
})

describe('SettingsProfileScreen — Purchase AI Credits Label', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStores()
  })

  it('renders Purchase AI Credits link under Billing section', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('Purchase AI Credits')).toBeTruthy()
  })

  it('renders BILLING section with plan info', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('BILLING')).toBeTruthy()
    expect(getByText('Current Plan')).toBeTruthy()
    expect(getByText('PRO')).toBeTruthy()
    expect(getByText('Manage Subscription')).toBeTruthy()
  })
})

describe('SettingsProfileScreen — Credit Packages Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStores()
  })

  it('opens credit packages modal when Buy Credit Packages is pressed', () => {
    const { getByText, queryByText } = render(<SettingsProfileScreen />)

    // Modal content not visible initially
    expect(queryByText('Buy AI Credits')).toBeNull()

    // Open modal
    fireEvent.press(getByText('Buy Credit Packages'))

    // Modal content visible
    expect(getByText('Buy AI Credits')).toBeTruthy()
    expect(getByText(/One-time credit packs/)).toBeTruthy()
  })

  it('opens credit packages modal from Add button', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Add'))
    expect(getByText('Buy AI Credits')).toBeTruthy()
  })

  it('opens credit packages modal from Purchase AI Credits link', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Purchase AI Credits'))
    expect(getByText('Buy AI Credits')).toBeTruthy()
  })

  it('renders all four credit packages', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))

    expect(getByText('50')).toBeTruthy()
    expect(getByText('$4.99')).toBeTruthy()
    expect(getByText('$0.10/credit')).toBeTruthy()

    expect(getByText('150')).toBeTruthy()
    expect(getByText('$9.99')).toBeTruthy()
    expect(getByText('BEST VALUE')).toBeTruthy()

    expect(getByText('500')).toBeTruthy()
    expect(getByText('$24.99')).toBeTruthy()

    expect(getByText('1000')).toBeTruthy()
    expect(getByText('$39.99')).toBeTruthy()
  })

  it('shows purchase confirmation alert when a package is tapped', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))

    // Tap the 50 credit pack (first pack - tap the price)
    fireEvent.press(getByText('$4.99'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Purchase Credits',
      'Add 50 credits for $4.99?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Buy Now' }),
      ])
    )
  })

  it('adds credits to balance when Buy Now is confirmed', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))

    // Tap the 50 credit pack
    fireEvent.press(getByText('$4.99'))

    // Simulate pressing "Buy Now" from alert
    const alertCalls = (Alert.alert as jest.Mock).mock.calls
    const buttons = alertCalls[0][2]
    const buyNow = buttons.find((b: any) => b.text === 'Buy Now')

    act(() => {
      buyNow.onPress()
    })

    // Balance should increase by 50
    expect(useCreditsStore.getState().balance).toBe(200) // 150 default + 50
  })

  it('shows success alert after purchase', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))
    fireEvent.press(getByText('$4.99'))

    const alertCalls = (Alert.alert as jest.Mock).mock.calls
    const buttons = alertCalls[0][2]
    const buyNow = buttons.find((b: any) => b.text === 'Buy Now')

    act(() => {
      buyNow.onPress()
    })

    // Second alert call is the success message
    expect(Alert.alert).toHaveBeenCalledWith(
      'Credits Added!',
      '50 credits have been added to your account.'
    )
  })

  it('closes credit packages modal', () => {
    const { getByText, queryByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))
    expect(getByText('Buy AI Credits')).toBeTruthy()

    fireEvent.press(getByText('Close'))
    expect(queryByText('Buy AI Credits')).toBeNull()
  })

  it('closes credit packages modal when tapping outside', () => {
    const { getByText, queryByText, getByTestId } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))
    expect(getByText('Buy AI Credits')).toBeTruthy()

    fireEvent.press(getByTestId('credit-packages-modal-backdrop'))
    expect(queryByText('Buy AI Credits')).toBeNull()
  })

  it('transitions to subscription modal from See Plans Instead button', () => {
    const { getByText, queryByTestId } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Buy Credit Packages'))
    expect(getByText('See Plans Instead')).toBeTruthy()

    fireEvent.press(getByText('See Plans Instead'))

    // Credit packages modal should close (Buy AI Credits no longer visible)
    // Subscription modal should open
    expect(queryByTestId('subscription-modal')).toBeTruthy()
  })
})

describe('SettingsProfileScreen — Subscription Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStores()
  })

  it('opens subscription modal when Upgrade Plan is pressed', () => {
    const { getByText, queryByTestId } = render(<SettingsProfileScreen />)

    expect(queryByTestId('subscription-modal')).toBeNull()
    fireEvent.press(getByText('Upgrade Plan'))
    expect(queryByTestId('subscription-modal')).toBeTruthy()
  })
})

describe('SettingsProfileScreen — Custom Interview Prep Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStores()
  })

  it('renders Custom Interview Prep row in Target Role Track section', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    expect(getByText('Custom Interview Prep')).toBeTruthy()
    expect(getByText('URL or pasted JD')).toBeTruthy()
  })

  it('opens the custom interview prep modal when row is pressed', () => {
    const { getByText, queryByText } = render(<SettingsProfileScreen />)

    // Modal not open initially
    expect(queryByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeNull()

    // Open modal
    fireEvent.press(getByText('Custom Interview Prep'))
    expect(getByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeTruthy()
  })

  it('renders Job URL and Paste Text tabs in the modal', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))

    expect(getByText('Job URL')).toBeTruthy()
    expect(getByText('Paste Text')).toBeTruthy()
  })

  it('switches between URL and Text input modes', () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))

    // Default: URL mode
    expect(getByPlaceholderText('https://company.com/jobs/senior-pm')).toBeTruthy()
    expect(queryByPlaceholderText('Paste the full job description text here')).toBeNull()

    // Switch to text mode
    fireEvent.press(getByText('Paste Text'))
    expect(getByPlaceholderText('Paste the full job description text here')).toBeTruthy()
    expect(queryByPlaceholderText('https://company.com/jobs/senior-pm')).toBeNull()
  })

  it('shows error for empty input on Update press', () => {
    const { getByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))

    fireEvent.press(getByText('Update'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing Input',
      'Paste a job description URL or job description text to continue.'
    )
  })

  it('shows error for invalid URL', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))

    fireEvent.changeText(
      getByPlaceholderText('https://company.com/jobs/senior-pm'),
      'not-a-valid-url'
    )
    fireEvent.press(getByText('Update'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid URL',
      'Enter a valid job description URL that starts with http:// or https://.'
    )
  })

  it('accepts valid URL and starts processing', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))

    fireEvent.changeText(
      getByPlaceholderText('https://company.com/jobs/senior-pm'),
      'https://acme.com/jobs/product-manager-role'
    )
    fireEvent.press(getByText('Update'))

    // Modal closes, processing starts
    await waitFor(() => {
      expect(getByText('Building custom interview prep')).toBeTruthy()
    })
  })

  it('closes modal on Cancel press', () => {
    const { getByText, queryByText, getAllByText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))
    expect(getByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeTruthy()

    fireEvent.press(getAllByText('Cancel')[0])
    expect(queryByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeNull()
  })

  it('closes custom interview prep modal when tapping outside', () => {
    const { getByText, queryByText, getByTestId } = render(<SettingsProfileScreen />)
    fireEvent.press(getByText('Custom Interview Prep'))
    expect(getByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeTruthy()

    fireEvent.press(getByTestId('custom-prep-modal-backdrop'))
    expect(queryByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeNull()
  })
})

describe('SettingsProfileScreen — Custom Interview Prep Processing & Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    resetStores()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('advances through processing steps and navigates to InterviewPrep', async () => {
    const { getByText, getByPlaceholderText } = render(<SettingsProfileScreen />)

    // Open modal and submit
    fireEvent.press(getByText('Custom Interview Prep'))
    fireEvent.changeText(
      getByPlaceholderText('https://company.com/jobs/senior-pm'),
      'https://acme.com/jobs/senior-product-manager'
    )

    await act(async () => {
      fireEvent.press(getByText('Update'))
    })

    // Processing modal should appear
    expect(getByText('Building custom interview prep')).toBeTruthy()
    expect(getByText('Validating job description source')).toBeTruthy()

    // Advance through steps
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        jest.advanceTimersByTime(900)
      })
    }

    // Processing finishes
    await act(async () => {
      jest.advanceTimersByTime(700)
    })

    // Should navigate to InterviewPrep with customPrep
    expect(mockNavigate).toHaveBeenCalledWith('InterviewPrep', expect.objectContaining({
      customPrep: expect.objectContaining({
        inferredRole: expect.any(String),
        roleTrack: expect.any(String),
        focusAreas: expect.any(Array),
        sourceType: 'url',
      })
    }))
  })
})

describe('SettingsProfileScreen — Custom Prep Placement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStores()
  })

  it('keeps profile as entry point only (no saved custom prep list)', () => {
    act(() => {
      useUserProfileStore.getState().saveCustomInterviewPrep({
        inferredRole: 'Data Scientist',
        roleTrack: 'Engineering',
        companyName: 'DataCo',
        sourceType: 'text',
        sourcePreview: 'Looking for a data scientist...',
        focusAreas: ['Statistical Analysis', 'ML Models'],
        generatedAt: new Date().toISOString(),
      })
    })

    const { getByText, queryByText } = render(<SettingsProfileScreen />)
    expect(getByText('Custom Interview Prep')).toBeTruthy()
    expect(queryByText(/No custom preps saved yet/i)).toBeNull()
    expect(queryByText(/DataCo/)).toBeNull()
  })
})

describe('SettingsProfileScreen — Editable Target Role & Profile Badges', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: [] })
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockGetCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 39.7392, longitude: -104.9903 },
    })
    mockReverseGeocodeAsync.mockResolvedValue([{ city: 'Denver', region: 'CO', district: 'Denver' }])
    resetStores()
    act(() => {
      useCareerSetupStore.getState().resetCareerSetup()
    })
  })

  it('allows selecting industry and updates role options context', () => {
    const { getByText, getAllByText, queryByText } = render(<SettingsProfileScreen />)

    fireEvent.press(getByText('Industry'))
    expect(getByText('Select Industry')).toBeTruthy()

    fireEvent.press(getByText('Design'))

    // Industry value updates
    expect(getByText('Design')).toBeTruthy()
    // Role should now be from design track
    expect(getAllByText('Product Designer').length).toBeGreaterThan(0)
    expect(queryByText('Software Engineer')).toBeNull()
  })

  it('allows editing seniority level', () => {
    const { getByText } = render(<SettingsProfileScreen />)

    fireEvent.press(getByText('Seniority Level'))
    expect(getByText('Select Seniority')).toBeTruthy()

    fireEvent.press(getByText('Senior'))

    expect(getByText('Senior')).toBeTruthy()
  })

  it('allows editing open-to-work status and location badge', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsProfileScreen />)

    // Open to work status
    fireEvent.press(getByText('Open to Work'))
    expect(getByText('Update Work Status')).toBeTruthy()
    fireEvent.press(getByText('Not Open to Work'))
    expect(getByText('Not Open to Work')).toBeTruthy()

    // Location
    fireEvent.press(getByText('San Francisco, CA'))
    expect(getByText('Update Location')).toBeTruthy()
    expect(getByText('Quick Actions')).toBeTruthy()
    expect(getByText('Suggested Locations')).toBeTruthy()
    expect(getByText('Use Current Location (GPS)')).toBeTruthy()
    fireEvent.changeText(getByPlaceholderText('City, State or Remote'), 'Austin, TX')
    fireEvent.press(getByText('Save'))

    expect(getByText('Austin, TX')).toBeTruthy()
  })

  it('shows location autocomplete suggestions and lets user pick one', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsProfileScreen />)

    fireEvent.press(getByText('San Francisco, CA'))
    const locationInput = getByPlaceholderText('City, State or Remote')
    fireEvent.changeText(locationInput, 'Aus')

    fireEvent.press(getByText('Austin, TX'))
    fireEvent.press(getByText('Save'))

    expect(getByText('Austin, TX')).toBeTruthy()
  })

  it('supports GPS location detection and saves the detected value', async () => {
    const { getByText } = render(<SettingsProfileScreen />)

    fireEvent.press(getByText('San Francisco, CA'))
    fireEvent.press(getByText('Use Current Location (GPS)'))

    await waitFor(() => {
      expect(getByText('Denver, CO')).toBeTruthy()
    })

    expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled()
    expect(mockGetCurrentPositionAsync).toHaveBeenCalled()
  })

  it('updates avatar from file picker when edit profile photo is pressed', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/new-profile-photo.jpg', name: 'new-profile-photo.jpg' }],
    })

    const { getByLabelText } = render(<SettingsProfileScreen />)
    fireEvent.press(getByLabelText('Edit profile photo'))

    await waitFor(() => {
      expect(useUserProfileStore.getState().avatarUrl).toBe('file:///tmp/new-profile-photo.jpg')
    })

    expect(mockGetDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ['image/*'],
        multiple: false,
      })
    )
  })
})
