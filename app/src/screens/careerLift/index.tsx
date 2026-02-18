import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ScreenLibrary } from './screenLibrary'
import { SplashScreen } from './splash'
import { OnboardingGoalsScreen } from './onboardingGoals'
import { OnboardingSetTargetsScreen } from './onboardingSetTargets'
import { ResumeIngestionScreen } from './ResumeIngestionScreen'
import { DashboardScreen } from './dashboard'
import { OutreachCenterScreen } from './outreachCenter'
import { JobTrackerScreen } from './jobTracker'
import { LinkedInKitScreen } from './linkedInKit'
import { MockInterviewScreen } from './mockInterview'
import { AIOnboardingScreen } from './aiOnboarding'
import { ATSResultsScreen } from './atsResults'
import { WeeklyDigestScreen } from './weeklyDigest'
import { SettingsProfileScreen } from './settingsProfile'
import { ApplyPackScreen } from './applyPack'
import { InterviewPrepScreen } from './interviewPrep'
import { careerLiftRoutes } from './routes'
import { CareerLiftTabs } from './tabs'

const Stack = createNativeStackNavigator()

export { careerLiftRoutes }

export function CareerLift() {
  return (
    <Stack.Navigator
      initialRouteName='Splash'
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#101722' },
      }}
    >
      <Stack.Screen name='ScreenLibrary' component={ScreenLibrary} />
      <Stack.Screen name='Splash' component={SplashScreen} />
      <Stack.Screen name='OnboardingGoals' component={OnboardingGoalsScreen} />
      <Stack.Screen name='OnboardingSetTargets' component={OnboardingSetTargetsScreen} />
      <Stack.Screen name='ResumeIngestion' component={ResumeIngestionScreen} />
      <Stack.Screen name='Dashboard' component={DashboardScreen} />
      <Stack.Screen name='OutreachCenter' component={OutreachCenterScreen} />
      <Stack.Screen name='JobTracker' component={JobTrackerScreen} />
      <Stack.Screen name='LinkedInKit' component={LinkedInKitScreen} />
      <Stack.Screen name='MockInterview' component={MockInterviewScreen} />
      <Stack.Screen name='AIOnboarding' component={AIOnboardingScreen} />
      <Stack.Screen name='ATSResults' component={ATSResultsScreen} />
      <Stack.Screen name='WeeklyDigest' component={WeeklyDigestScreen} />
      <Stack.Screen name='SettingsProfile' component={SettingsProfileScreen} />
      <Stack.Screen name='MainTabs' component={CareerLiftTabs} />
      <Stack.Screen name='ApplyPack' component={ApplyPackScreen} />
      <Stack.Screen name='InterviewPrep' component={InterviewPrepScreen} />
    </Stack.Navigator>
  )
}
