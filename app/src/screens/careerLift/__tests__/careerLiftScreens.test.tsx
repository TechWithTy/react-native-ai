import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { careerLiftRoutes } from '../routes'
import { ScreenLibrary } from '../screenLibrary'
import { SplashScreen } from '../splash'
import { OnboardingGoalsScreen } from '../onboardingGoals'
import { OnboardingSetTargetsScreen } from '../onboardingSetTargets'
import { ResumeIngestionScreen } from '../ResumeIngestionScreen'
import { DashboardScreen } from '../dashboard'
import { OutreachCenterScreen } from '../outreachCenter'
import { JobTrackerScreen } from '../jobTracker'
import { LinkedInKitScreen } from '../linkedInKit'
import { MockInterviewScreen } from '../mockInterview'
import { AIOnboardingScreen } from '../aiOnboarding'
import { ATSResultsScreen } from '../atsResults'
import { WeeklyDigestScreen } from '../weeklyDigest'
import { SettingsProfileScreen } from '../settingsProfile'
import { ApplyPackScreen } from '../applyPack'
import { InterviewPrepScreen } from '../interviewPrep'
import { JobDetailsScreen } from '../jobDetails'
import { useCareerSetupStore } from '../../../store/careerSetup'

describe('careerLiftRoutes', () => {
  it('contains all required screen routes', () => {
    expect(careerLiftRoutes).toHaveLength(17)
    expect(careerLiftRoutes.map(route => route.key)).toEqual([
      'Splash',
      'OnboardingGoals',
      'OnboardingSetTargets',
      'ResumeIngestion',
      'ResumeUpload',
      'Dashboard',
      'JobDetails',
      'OutreachCenter',
      'JobTracker',
      'LinkedInKit',
      'MockInterview',
      'AIOnboarding',
      'ATSResults',
      'WeeklyDigest',
      'SettingsProfile',
      'ApplyPack',
      'InterviewPrep',
    ])
  })
})

describe('CareerLift screens', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
    act(() => {
      useCareerSetupStore.getState().resetCareerSetup()
    })
  })

  it('renders screen library and route entries', () => {
    const { getByText } = render(<ScreenLibrary navigation={navigation} />)
    expect(getByText('Career Lift Screens')).toBeTruthy()
    expect(getByText('Onboarding: Resume Ingestion')).toBeTruthy()
    expect(getByText('Interview Preparation Pack')).toBeTruthy()
  })

  it('navigates from splash on continue', () => {
    const { getByText } = render(<SplashScreen navigation={navigation} />)
    fireEvent.press(getByText('Get Started'))
    expect(navigation.navigate).toHaveBeenCalledWith('OnboardingGoals')
  })

  it('navigates to AI onboarding from splash', () => {
    const { getByText } = render(<SplashScreen navigation={navigation} />)
    fireEvent.press(getByText('Get Started with AI'))
    expect(navigation.navigate).toHaveBeenCalledWith('AIOnboarding')
  })

  it.each([
    { name: 'Splash', component: SplashScreen, heading: 'Career Lift' },
    { name: 'OnboardingGoals', component: OnboardingGoalsScreen, heading: 'Define Your Path' },
    { name: 'OnboardingSetTargets', component: OnboardingSetTargetsScreen, heading: 'Set Your Target' },
    { name: 'ResumeIngestion', component: ResumeIngestionScreen, heading: 'Source Resume' },
    // { name: 'ResumeUpload', component: ResumeUploadScreen, heading: 'Lets get your baseline' },
    { name: 'Dashboard', component: DashboardScreen, heading: 'Your Pipeline' },
    { name: 'JobDetails', component: JobDetailsScreen, heading: 'Job Details' },
    { name: 'OutreachCenter', component: OutreachCenterScreen, heading: 'Outreach Center' },
    { name: 'JobTracker', component: JobTrackerScreen, heading: 'My Pipeline' },
    { name: 'LinkedInKit', component: LinkedInKitScreen, heading: 'LinkedIn Kit' },
    { name: 'MockInterview', component: MockInterviewScreen, heading: 'Behavioral Interview' },
    { name: 'AIOnboarding', component: AIOnboardingScreen, heading: 'Career Goals' },
    { name: 'ATSResults', component: ATSResultsScreen, heading: 'Scan Results' },
    { name: 'WeeklyDigest', component: WeeklyDigestScreen, heading: 'WEEKLY DIGEST' },
    { name: 'SettingsProfile', component: SettingsProfileScreen, heading: 'Settings and Profile' },
    { name: 'ApplyPack', component: ApplyPackScreen, heading: 'Review Package' },
    { name: 'InterviewPrep', component: InterviewPrepScreen, heading: 'Interview Preparation Pack' },
  ])('renders $name screen content', ({ component: Component, heading }) => {
    const { getByText } = render(<Component navigation={navigation} />)
    expect(getByText(heading)).toBeTruthy()
  })

  it('dashboard bottom navigation items are clickable', () => {
    const { getByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByText('Jobs'))
    fireEvent.press(getByText('Docs'))
    fireEvent.press(getByText('Profile'))

    expect(navigation.navigate).toHaveBeenCalledWith('JobTracker')
    expect(navigation.navigate).toHaveBeenCalledWith('ApplyPack')
    expect(navigation.navigate).toHaveBeenCalledWith('SettingsProfile')
  })

  it('shows role options based on selected track', () => {
    useCareerSetupStore.getState().setCareerSetup({
      roleTrack: 'Design',
      targetRole: 'Product Designer',
    })

    const { getByText, queryByText } = render(<OnboardingSetTargetsScreen navigation={navigation} />)

    expect(getByText('Product Designer')).toBeTruthy()
    expect(queryByText('Software Engineer')).toBeNull()
  })

  it('renders target screen sections for goals and skills', () => {
    const { getByText, getByPlaceholderText } = render(
      <OnboardingSetTargetsScreen navigation={navigation} />
    )

    expect(getByText('Step 2 of 4')).toBeTruthy()
    expect(getByText('Role Track')).toBeTruthy()
    expect(getByPlaceholderText('Ex: Product Designer')).toBeTruthy()
    expect(getByText('Desired Salary Range')).toBeTruthy()
    expect(getByText('Position Goals')).toBeTruthy()
    expect(getByText('Highlighted Skills')).toBeTruthy()
  })

  it('renders onboarding goals sections for seniority and location cards', () => {
    const { getByText } = render(<OnboardingGoalsScreen navigation={navigation} />)

    expect(getByText('Seniority Level')).toBeTruthy()
    expect(getByText('Location Preference')).toBeTruthy()
  })
})
