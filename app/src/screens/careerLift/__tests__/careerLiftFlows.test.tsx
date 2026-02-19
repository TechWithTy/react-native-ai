import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { SplashScreen } from '../splash'
import { OnboardingGoalsScreen } from '../onboardingGoals'
import { OnboardingSetTargetsScreen } from '../onboardingSetTargets'
import { ResumeIngestionScreen } from '../ResumeIngestionScreen'
import { useCareerSetupStore } from '../../../store/careerSetup'
import { useUserProfileStore } from '../../../store/userProfileStore'

const mockRequestForegroundPermissionsAsync = jest.fn()
const mockGetCurrentPositionAsync = jest.fn()
const mockReverseGeocodeAsync = jest.fn()
const mockRequestPushNotificationsPermission = jest.fn()

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
    getCitiesOfCountry: () => [],
  },
  State: {
    getStatesOfCountry: () => [],
  },
}))

jest.mock('../../../utils/pushNotificationsPermission', () => ({
  requestPushNotificationsPermission: (...args: unknown[]) => mockRequestPushNotificationsPermission(...args),
}))

describe('CareerLift flows', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestPushNotificationsPermission.mockResolvedValue('granted')
    act(() => {
      useCareerSetupStore.getState().resetCareerSetup()
      useUserProfileStore.getState().resetProfile()
    })
  })

  it('moves from splash to onboarding goals', () => {
    const { getByText } = render(<SplashScreen navigation={navigation} />)
    fireEvent.press(getByText('Get Started'))
    expect(navigation.navigate).toHaveBeenCalledWith('OnboardingGoals')
  })

  it('moves from onboarding goals to step 2', () => {
    const { getByText, getByPlaceholderText } = render(<OnboardingGoalsScreen navigation={navigation} />)
    fireEvent.press(getByText('Engineering'))
    fireEvent.press(getByText('Senior'))
    fireEvent.press(getByText('Hybrid'))
    fireEvent.changeText(getByPlaceholderText('City, State'), 'Austin, TX')
    fireEvent.press(getByText('Save'))
    fireEvent.press(getByText('Next Step'))
    expect(navigation.navigate).toHaveBeenCalledWith('OnboardingSetTargets')
  })

  it('step 2 continue action works', () => {
    act(() => {
      useCareerSetupStore.getState().setCareerSetup({
        roleTrack: 'Engineering',
        targetRole: 'Frontend Engineer',
        desiredSalaryRange: '$175k-$210k+',
        selectedGoals: ['UI Performance'],
        selectedSkills: ['React Native'],
      })
    })
    const { getByText } = render(<OnboardingSetTargetsScreen navigation={navigation} />)
    fireEvent.press(getByText('Continue'))
    expect(navigation.navigate).toHaveBeenCalledWith('ResumeIngestion')
  })

  it('resume ingestion actions work', () => {
    const { getByText } = render(<ResumeIngestionScreen navigation={navigation} />)
    
    // Test LinkedIn Modal Flow
    fireEvent.press(getByText('Import from LinkedIn'))
    expect(getByText('LinkedIn Authorization')).toBeTruthy()
    
    fireEvent.press(getByText('Authorize LinkedIn'))
    fireEvent.press(getByText('Use Imported Profile'))
    expect(mockRequestPushNotificationsPermission).toHaveBeenCalledWith('onboarding')
    expect(navigation.navigate).toHaveBeenCalledWith('MainTabs')
  })

  it('prompts push permission when completing onboarding with an uploaded resume', () => {
    act(() => {
      useCareerSetupStore.getState().setCareerSetup({
        sourceResumeName: 'My_Resume.pdf',
      })
    })

    const { getByText } = render(<ResumeIngestionScreen navigation={navigation} />)
    fireEvent.press(getByText('Complete Setup'))

    expect(mockRequestPushNotificationsPermission).toHaveBeenCalledWith('onboarding')
    expect(navigation.navigate).toHaveBeenCalledWith('MainTabs')
  })

  it('step 2 role options and highlighted skills follow selected track', () => {
    act(() => {
      useCareerSetupStore.getState().setCareerSetup({
        roleTrack: 'Design',
        targetRole: 'Product Designer',
      })
    })

    const { getByText, queryByText, rerender } = render(<OnboardingSetTargetsScreen navigation={navigation} />)
    expect(getByText('Product Designer')).toBeTruthy()
    expect(getByText('User Research')).toBeTruthy()
    expect(queryByText('Software Engineer')).toBeNull()

    act(() => {
      useCareerSetupStore.getState().setCareerSetup({
        roleTrack: 'Data',
        targetRole: 'Data Scientist',
      })
    })

    rerender(<OnboardingSetTargetsScreen navigation={navigation} />)
    expect(getByText('Machine Learning')).toBeTruthy()
    expect(queryByText('User Research')).toBeNull()
  })

  it('step 1 supports seniority and location cards', () => {
    const { getByText } = render(<OnboardingGoalsScreen navigation={navigation} />)

    fireEvent.press(getByText('Senior'))
    expect(useCareerSetupStore.getState().targetSeniority).toBe('Senior')

    fireEvent.press(getByText('On-site'))
    expect(useCareerSetupStore.getState().locationPreference).toBe('On-site')
    expect(useCareerSetupStore.getState().locationPreferences).toEqual(['On-site'])
    expect(getByText('Set Your Preferred Location')).toBeTruthy()
  })

  it('saves onboarding location from modal for hybrid or on-site', () => {
    const { getByText, getByPlaceholderText } = render(<OnboardingGoalsScreen navigation={navigation} />)

    fireEvent.press(getByText('Hybrid'))
    fireEvent.changeText(getByPlaceholderText('City, State'), 'Austin, TX')
    fireEvent.press(getByText('Save'))

    expect(useUserProfileStore.getState().currentLocation).toBe('Austin, TX')
  })

  it('supports multiple working styles without requiring location twice', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<OnboardingGoalsScreen navigation={navigation} />)

    fireEvent.press(getByText('Hybrid'))
    fireEvent.changeText(getByPlaceholderText('City, State'), 'Austin, TX')
    fireEvent.press(getByText('Save'))
    expect(queryByText('Set Your Preferred Location')).toBeNull()

    fireEvent.press(getByText('On-site'))

    expect(useCareerSetupStore.getState().locationPreferences).toEqual(['Hybrid', 'On-site'])
    expect(queryByText('Set Your Preferred Location')).toBeNull()
  })

  it('does not reopen location modal when selecting remote or deselecting options', () => {
    const { getByText, queryByText } = render(<OnboardingGoalsScreen navigation={navigation} />)

    fireEvent.press(getByText('Hybrid'))
    expect(getByText('Set Your Preferred Location')).toBeTruthy()
    fireEvent.press(getByText('Cancel'))
    expect(queryByText('Set Your Preferred Location')).toBeNull()

    fireEvent.press(getByText('Remote'))
    expect(queryByText('Set Your Preferred Location')).toBeNull()

    fireEvent.press(getByText('Remote'))
    expect(queryByText('Set Your Preferred Location')).toBeNull()
  })

  it('step 2 supports searchable role and goals/skills content', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <OnboardingSetTargetsScreen navigation={navigation} />
    )

    fireEvent.changeText(getByPlaceholderText('Ex: Product Designer'), 'Front')
    expect(getByText('Frontend Engineer')).toBeTruthy()
    expect(queryByText('Backend Engineer')).toBeNull()

    fireEvent.press(getByText('Frontend Engineer'))
    expect(getByText('Position Goals')).toBeTruthy()
    expect(getByText('Highlighted Skills')).toBeTruthy()
    expect(getByText('Desired Salary Range')).toBeTruthy()

    fireEvent.press(getByText('UI Performance'))
    expect(useCareerSetupStore.getState().selectedGoals).toContain('UI Performance')

    fireEvent.press(getByText('React Native'))
    expect(useCareerSetupStore.getState().selectedSkills).toContain('React Native')

    fireEvent.press(getByText('$175k-$210k+'))
    expect(useCareerSetupStore.getState().desiredSalaryRange).toBe('$175k-$210k+')
  })
})
