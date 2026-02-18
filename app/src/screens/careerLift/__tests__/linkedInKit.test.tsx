import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import { LinkedInKitScreen } from '../linkedInKit'
import { useUserProfileStore } from '../../../store/userProfileStore'
import { useCareerSetupStore } from '../../../store/careerSetup'
import { useCreditsStore } from '../../../store/creditsStore'
import { useLinkedInKitStore } from '../../../store/linkedInKitStore'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
}))

describe('LinkedInKitScreen', () => {
  const mockSetStringAsync = Clipboard.setStringAsync as jest.Mock
  const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})

  const openGeneratedKitFromResume = () => {
    useCareerSetupStore.getState().setCareerSetup({ sourceResumeName: 'Alex_Resume.pdf' })
    const screen = render(<LinkedInKitScreen />)
    fireEvent.press(screen.getByText('Alex_Resume.pdf'))
    fireEvent.press(screen.getByLabelText('Generate LinkedIn Kit'))
    return screen
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useUserProfileStore.getState().resetProfile()
    useCareerSetupStore.getState().resetCareerSetup()
    useCreditsStore.getState().resetCredits()
    useLinkedInKitStore.getState().resetLinkedInKit()
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: [] })
  })

  afterAll(() => {
    alertSpy.mockRestore()
  })

  it('shows setup flow first and charges credits on generation', () => {
    useCareerSetupStore.getState().setCareerSetup({ sourceResumeName: 'Alex_Resume.pdf' })
    const startBalance = useCreditsStore.getState().balance
    const { getByText, getByLabelText } = render(<LinkedInKitScreen />)

    expect(getByText('Set up your LinkedIn Kit')).toBeTruthy()
    fireEvent.press(getByText('Alex_Resume.pdf'))
    fireEvent.press(getByLabelText('Generate LinkedIn Kit'))

    expect(getByText('Profile Strength')).toBeTruthy()
    expect(useLinkedInKitStore.getState().activeSession?.sourceType).toBe('resume')
    expect(useCreditsStore.getState().balance).toBe(startBalance - 6)
  })

  it('supports LinkedIn connect path before generation', () => {
    const { getByText, getByLabelText } = render(<LinkedInKitScreen />)

    fireEvent.press(getByText('LinkedIn'))
    expect(getByText('Optimize your LinkedIn')).toBeTruthy()
    fireEvent.press(getByText('Connect LinkedIn'))
    fireEvent.press(getByLabelText('Generate LinkedIn Kit'))

    expect(useUserProfileStore.getState().linkedInConnected).toBe(true)
    expect(useLinkedInKitStore.getState().activeSession?.sourceType).toBe('linkedin')
    expect(getByText('Source: LinkedIn Profile')).toBeTruthy()
  })

  it('allows uploading a resume in setup and stores it in career setup', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'New_Resume.pdf' }],
    })
    const { getByText } = render(<LinkedInKitScreen />)

    fireEvent.press(getByText('Upload Resume'))

    await waitFor(() => {
      expect(mockGetDocumentAsync).toHaveBeenCalled()
      expect(useCareerSetupStore.getState().sourceResumeName).toBe('New_Resume.pdf')
    })
  })

  it('blocks generation when credits are insufficient', () => {
    useCareerSetupStore.getState().setCareerSetup({ sourceResumeName: 'Alex_Resume.pdf' })
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')
    useCreditsStore.getState().spendCredits('mockInterview')

    const { getByText, getByLabelText } = render(<LinkedInKitScreen />)
    fireEvent.press(getByText('Alex_Resume.pdf'))
    fireEvent.press(getByLabelText('Generate LinkedIn Kit'))

    expect(alertSpy).toHaveBeenCalledWith(
      'Not enough credits',
      expect.stringContaining('LinkedIn Kit requires 6 credits')
    )
    expect(useLinkedInKitStore.getState().activeSession).toBeNull()
  })

  it('copies optimized text to clipboard', async () => {
    const { getByLabelText, findByText } = openGeneratedKitFromResume()

    fireEvent.press(getByLabelText('Copy optimized LinkedIn text'))

    expect(mockSetStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('Senior Software Engineer | React & TypeScript Specialist')
    )
    expect(await findByText('Copied')).toBeTruthy()
  })

  it('persists quick wins selection via user profile store', () => {
    const { getByText, unmount } = openGeneratedKitFromResume()

    expect(getByText('2 pending')).toBeTruthy()
    fireEvent.press(getByText('Enable "Open to Work"'))
    expect(getByText('1 pending')).toBeTruthy()
    expect(useUserProfileStore.getState().linkedInKitWins.openToWork).toBe(true)

    unmount()
    const { getByText: getByTextAgain } = render(<LinkedInKitScreen />)
    expect(getByTextAgain('1 pending')).toBeTruthy()
  })
})
