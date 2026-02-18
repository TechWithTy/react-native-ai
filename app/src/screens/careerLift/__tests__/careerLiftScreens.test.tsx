import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { careerLiftRoutes } from '../routes'
import { ScreenLibrary } from '../screenLibrary'
import { SplashScreen } from '../splash'
import { OnboardingGoalsScreen } from '../onboardingGoals'
import { OnboardingSetTargetsScreen } from '../onboardingSetTargets'
import { ResumeIngestionScreen } from '../ResumeIngestionScreen'
import { DashboardScreen } from '../dashboard'
import { JobDetailsScreen } from '../jobDetails'
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
import { AccountSecurityScreen } from '../accountSecurity'
import { NotificationsPreferencesScreen } from '../notificationPreferences'
import { DocumentsInsightsScreen } from '../documentsInsights'
import { UpdateEmailScreen } from '../updateEmail'
import { UpdatePasswordScreen } from '../updatePassword'
import { useCareerSetupStore } from '../../../store/careerSetup'
import { useNavigation, NavigationContainer } from '@react-navigation/native'

const mockedNavigate = jest.fn()

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}))

jest.mock('country-state-city', () => ({
  City: {
    getCitiesOfCountry: () => [],
  },
  State: {
    getStatesOfCountry: () => [],
  },
}))

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native')
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockedNavigate,
      goBack: jest.fn(),
      setParams: jest.fn(),
      addListener: jest.fn(),
      setOptions: jest.fn(),
      dispatch: jest.fn(),
      isFocused: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    useIsFocused: jest.fn(() => true),
  }
})

describe('careerLiftRoutes', () => {
  it('contains all required screen routes', () => {
    expect(careerLiftRoutes).toHaveLength(22)
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
      'NotificationsPreferences',
      'AccountSecurity',
      'DocumentsInsights',
      'UpdateEmail',
      'UpdatePassword',
      'ApplyPack',
      'InterviewPrep',
    ])
  })
})

describe('CareerLift screens', () => {
  const navigation = {
    navigate: mockedNavigate,
    goBack: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
    mockedNavigate.mockClear()
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

  it('navigates to AI chat from splash', () => {
    const { getByText } = render(<SplashScreen navigation={navigation} />)
    fireEvent.press(getByText('Get Started with AI'))
    expect(navigation.navigate).toHaveBeenCalledWith('MainTabs', { screen: 'AICoach' })
  })

  it.each([
    { name: 'Splash', component: SplashScreen, heading: 'Career Lift' },
    { name: 'OnboardingGoals', component: OnboardingGoalsScreen, heading: 'Define Your Path' },
    { name: 'OnboardingSetTargets', component: OnboardingSetTargetsScreen, heading: 'Set Your Target' },
    { name: 'ResumeIngestion', component: ResumeIngestionScreen, heading: 'Source Resume' },
    // { name: 'ResumeUpload', component: ResumeUploadScreen, heading: 'Lets get your baseline' },
    { name: 'Dashboard', component: DashboardScreen, heading: 'Weekly Plan' },
    { name: 'JobDetails', component: JobDetailsScreen, heading: 'Job Details' },
    { name: 'OutreachCenter', component: OutreachCenterScreen, heading: 'Outreach Center' },
    { name: 'JobTracker', component: JobTrackerScreen, heading: 'My Pipeline' },
    { name: 'LinkedInKit', component: LinkedInKitScreen, heading: 'LinkedIn Kit' },
    { name: 'MockInterview', component: MockInterviewScreen, heading: 'Behavioral' },
    { name: 'AIOnboarding', component: AIOnboardingScreen, heading: 'Career Goals' },
    { name: 'ATSResults', component: ATSResultsScreen, heading: 'Scan Results' },
    { name: 'WeeklyDigest', component: WeeklyDigestScreen, heading: 'WEEKLY DIGEST' },
    { name: 'SettingsProfile', component: SettingsProfileScreen, heading: 'TARGET ROLE TRACK' },
    { name: 'NotificationsPreferences', component: NotificationsPreferencesScreen, heading: 'Notification Preferences' },
    { name: 'AccountSecurity', component: AccountSecurityScreen, heading: 'Account & Security' },
    { name: 'DocumentsInsights', component: DocumentsInsightsScreen, heading: 'Documents & Insights' },
    { name: 'UpdateEmail', component: UpdateEmailScreen, heading: 'Update Email' },
    { name: 'UpdatePassword', component: UpdatePasswordScreen, heading: 'Update Password' },
    { name: 'ApplyPack', component: ApplyPackScreen, heading: 'Review Package' },
    { name: 'InterviewPrep', component: InterviewPrepScreen, heading: 'Interview Prep' },
  ])('renders $name screen content', ({ component: Component, heading }) => {
    const { getAllByText } = render(
      <NavigationContainer>
        <Component navigation={navigation} />
      </NavigationContainer>
    )
    expect(getAllByText(new RegExp(heading, 'i')).length).toBeGreaterThan(0)
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

    expect(getByText('Step 2 of 3')).toBeTruthy()
    expect(getByText('Role Track')).toBeTruthy()
    expect(getByPlaceholderText('Ex: Product Designer')).toBeTruthy()
    expect(getByText('Desired Salary Range')).toBeTruthy()
    expect(getByText('Position Goals')).toBeTruthy()
    expect(getByText('Highlighted Skills')).toBeTruthy()
  })

  it('renders onboarding goals sections for seniority and location cards', () => {
    const { getByText } = render(<OnboardingGoalsScreen navigation={navigation} />)

    expect(getByText('CURRENT SENIORITY')).toBeTruthy()
    expect(getByText('PREFERRED WORKING STYLE')).toBeTruthy()
  })
})
