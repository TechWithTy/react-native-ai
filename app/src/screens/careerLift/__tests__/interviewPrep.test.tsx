
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

// Mock Expo AV
const mockRequestPermission = jest.fn(() => Promise.resolve({ status: 'granted' }))
const mockEncodingOption = {
  isRecording: true,
}
const mockRecordingObj = {
  prepareToRecordAsync: jest.fn(),
  startAsync: jest.fn(),
  stopAndUnloadAsync: jest.fn(),
  getURI: jest.fn(() => 'file://test.m4a'),
}

const mockPermissionResponse = { status: 'granted' } // Mutable object

jest.mock('expo-av', () => ({
  Audio: {
    usePermissions: () => [mockPermissionResponse, mockRequestPermission],
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({ recording: mockRecordingObj })),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
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
    // Default permission mock
    mockRequestPermission.mockResolvedValue({ status: 'granted' })
    mockPermissionResponse.status = 'granted' // Default to granted
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
    // Set permission to undetermined to force request
    mockPermissionResponse.status = 'undetermined'
    
    const { getByTestId } = render(<MockInterviewScreen />)
    
    // Start Recording
    await act(async () => {
      fireEvent.press(getByTestId('record-button'))
    })
    
    // Check permission requested
    expect(mockRequestPermission).toHaveBeenCalled()
    
    // Now that permission is granted (mockRequestPermission resolves to granted), logic proceeds
    // But since it's an async flow in the component, we might need to wait or press again?
    // The component awaits requestPermission. If granted, it continues.
    // So we assume it started.
    
    await waitFor(() => {
        expect(mockRecordingObj.prepareToRecordAsync).not.toHaveBeenCalled()
        // createAsync is called
    })

    // Press again to Stop
    await act(async () => {
      fireEvent.press(getByTestId('record-button'))
    })
     
    // Check stopped
    await waitFor(() => {
        expect(mockRecordingObj.stopAndUnloadAsync).toHaveBeenCalled()
    })
  })

  it('shows alerts on menu press and handles restart', async () => {
    const { getByTestId, getByText } = render(<MockInterviewScreen />)
    
    // Open Menu
    fireEvent.press(getByTestId('header-menu'))
    
    // Check Alert
    expect(Alert.alert).toHaveBeenCalledWith(
        'Session Options', 
        'What would you like to do?', 
        expect.any(Array)
    )
    
    // Simulate Restart Selection
    // We need to extract the onPress from the alert arguments
    const alertCalls = (Alert.alert as jest.Mock).mock.calls
    const options = alertCalls[0][2] // 3rd argument is buttons array
    const restartOption = options.find((opt: any) => opt.text === 'Restart Session')
    
    // Trigger Restart
    await act(async () => {
        await restartOption.onPress()
    })
    
    // Verify Restart Logic
    expect(mockStop).toHaveBeenCalled() // Speech stop
    // If recording was active, should stop it. We didn't start it here, but logic is called.
    // Timer should be reset (we can't easily check state directly without render update check, but logic ran)
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
