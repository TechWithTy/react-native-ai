import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { SplashScreen } from '../splash'
import { OnboardingGoalsScreen } from '../onboardingGoals'
import { OnboardingSetTargetsScreen } from '../onboardingSetTargets'
import { ResumeIngestionScreen } from '../resumeIngestion'
import { ResumeUploadScreen } from '../resumeUpload'
import { useCareerSetupStore } from '../../../store/careerSetup'

describe('CareerLift flows', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    act(() => {
      useCareerSetupStore.getState().resetCareerSetup()
    })
  })

  it('moves from splash to onboarding goals', () => {
    const { getByText } = render(<SplashScreen navigation={navigation} />)
    fireEvent.press(getByText('Get Started'))
    expect(navigation.navigate).toHaveBeenCalledWith('OnboardingGoals')
  })

  it('moves from onboarding goals to step 2', () => {
    const { getByText } = render(<OnboardingGoalsScreen navigation={navigation} />)
    fireEvent.press(getByText('Next Step'))
    expect(navigation.navigate).toHaveBeenCalledWith('OnboardingSetTargets')
  })

  it('step 2 back/continue actions work', () => {
    const { getAllByText, getByText } = render(<OnboardingSetTargetsScreen navigation={navigation} />)
    fireEvent.press(getAllByText('Back')[0])
    expect(navigation.goBack).toHaveBeenCalled()

    fireEvent.press(getByText('Continue'))
    expect(navigation.navigate).toHaveBeenCalledWith('ResumeIngestion')
  })

  it('resume ingestion actions work', () => {
    const { getByText } = render(<ResumeIngestionScreen navigation={navigation} />)
    fireEvent.press(getByText('Import from LinkedIn'))
    expect(navigation.navigate).toHaveBeenCalledWith('LinkedInKit')

    fireEvent.press(getByText('Skip for now'))
    expect(navigation.navigate).toHaveBeenCalledWith('Dashboard')

    fireEvent.press(getByText('Continue'))
    expect(navigation.navigate).toHaveBeenCalledWith('ResumeUpload')
  })

  it('resume upload actions work', () => {
    const { getByText } = render(<ResumeUploadScreen navigation={navigation} />)
    fireEvent.press(getByText('Back'))
    expect(navigation.goBack).toHaveBeenCalled()

    fireEvent.press(getByText('Finish Setup'))
    expect(navigation.navigate).toHaveBeenCalledWith('Dashboard')
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
