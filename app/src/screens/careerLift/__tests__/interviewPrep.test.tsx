
import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { MockInterviewScreen } from '../mockInterview'
import { Alert } from 'react-native'

// --- Mocks ---

// Mock Navigation
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      question: 'Test Question?',
      category: 'Behavioral',
    },
  }),
}))

// Mock Expo Audio
const mockRequestRecordingPermissionsAsync = jest.fn(() => Promise.resolve({ granted: true }))
const mockSetAudioModeAsync = jest.fn(() => Promise.resolve())
const mockRecordingObj = {
  prepareToRecordAsync: jest.fn(),
  record: jest.fn(),
  stop: jest.fn(),
  uri: 'file://test.m4a',
}

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: (...args: any[]) => mockRequestRecordingPermissionsAsync(...args),
  setAudioModeAsync: (...args: any[]) => mockSetAudioModeAsync(...args),
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
  useAudioRecorder: () => mockRecordingObj,
}))

// Mock Expo Speech
const mockSpeak = jest.fn()
const mockStop = jest.fn()
const mockIsSpeakingAsync = jest.fn(() => Promise.resolve(false))

jest.mock('expo-speech', () => ({
  __esModule: true,
  speak: (...args: any[]) => mockSpeak(...args),
  stop: () => mockStop(),
  isSpeakingAsync: () => mockIsSpeakingAsync(),
}))

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'Icon',
  Feather: 'Icon',
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

describe('MockInterviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true })
    mockIsSpeakingAsync.mockResolvedValue(false)
  })

  it('renders correctly with initial state', async () => {
    const { getByText } = render(<MockInterviewScreen />)
    
    // Check Header
    expect(getByText('BEHAVIORAL')).toBeTruthy()
    
    // Check Question
    expect(getByText('Test Question?')).toBeTruthy()
    
    // Check Timer
    expect(getByText('01:45')).toBeTruthy()
    
    // Check Controls
    expect(getByText('Reset')).toBeTruthy()
    expect(getByText('Done')).toBeTruthy()
  })

  it('starts speaking question on mount', async () => {
    render(<MockInterviewScreen />)
    
    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith('Test Question?', expect.any(Object))
    }, { timeout: 1000 })
  })

  it('toggles rubric visibility', () => {
    const { getByText, queryByText } = render(<MockInterviewScreen />)
    
    // Initially hidden
    expect(queryByText('Conflict Resolution:')).toBeNull()
    
    // Toggle
    fireEvent.press(getByText('Show Evaluation Rubric'))
    
    // Should be visible
    expect(getByText('Conflict Resolution:')).toBeTruthy()
  })

  it('handles recording toggle correctly', async () => {
    const { getByTestId } = render(<MockInterviewScreen />)
    
    // Start Recording
    await act(async () => {
      fireEvent.press(getByTestId('record-button'))
    })
    
    // Check permission requested
    expect(mockRequestRecordingPermissionsAsync).toHaveBeenCalled()
    
    // Now that permission is granted (mockRequestPermission resolves to granted), logic proceeds
    // But since it's an async flow in the component, we might need to wait or press again?
    // The component awaits requestPermission. If granted, it continues.
    // So we assume it started.
    
    await waitFor(() => {
        expect(mockRecordingObj.prepareToRecordAsync).toHaveBeenCalled()
        expect(mockRecordingObj.record).toHaveBeenCalled()
    })

    // Press again to Stop
    await act(async () => {
      fireEvent.press(getByTestId('record-button'))
    })
     
    // Check stopped
    await waitFor(() => {
        expect(mockRecordingObj.stop).toHaveBeenCalled()
    })
  })

  it('shows menu and handles restart', async () => {
    const { getByTestId, getByText } = render(<MockInterviewScreen />)
    
    // Open Menu
    fireEvent.press(getByTestId('header-menu'))
    
    // Check Menu Option visibility (Modal content)
    expect(getByText('Session Options')).toBeTruthy()
    const restartButton = getByText('Restart Session')
    expect(restartButton).toBeTruthy()
    
    // Trigger Restart
    await act(async () => {
        fireEvent.press(restartButton)
    })
    
    // Verify Restart Logic
    expect(mockStop).toHaveBeenCalled() // Speech stop
    // If recording was active, should stop it. We didn't start it here, but logic is called.
  })

  it('resets session and handles done', async () => {
    const { getByText, getByTestId } = render(<MockInterviewScreen />)
    
    // Press Reset
    fireEvent.press(getByText('Reset'))
    // Should stop speech
    expect(mockStop).toHaveBeenCalled()
    
    // Press Done
    fireEvent.press(getByText('Done'))
    // Should stop speech and go back
    expect(mockStop).toHaveBeenCalledTimes(2)
    expect(mockGoBack).toHaveBeenCalled()
  })
})
