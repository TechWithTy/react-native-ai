import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ScreenLibrary } from './screenLibrary'
import { SplashScreen } from './splash'
import { AuthEntryScreen } from './authEntry'
import { ForgotPasswordScreen } from './forgotPassword'
import { ForgotEmailScreen } from './forgotEmail'
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
import { JobDetailsScreen } from './jobDetails'
import { AccountSecurityScreen } from './accountSecurity'
import { UpdatePasswordScreen } from './updatePassword'
import { UpdateEmailScreen } from './updateEmail'
import { NotificationsPreferencesScreen } from './notificationPreferences'
import { DocumentsInsightsScreen } from './documentsInsights'
import { MonetizationPromptsScreen } from './monetizationPrompts'
import { careerLiftRoutes } from './routes'
import { CareerLiftTabs } from './tabs'
import { CLTheme } from './theme'

const Stack = createNativeStackNavigator()

export { careerLiftRoutes }

export function CareerLift() {
  return (
    <Stack.Navigator
      initialRouteName='Splash'
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: CLTheme.background },
      }}
    >
      <Stack.Screen name='ScreenLibrary' component={ScreenLibrary} />
      <Stack.Screen name='Splash' component={SplashScreen} />
      <Stack.Screen name='AuthEntry' component={AuthEntryScreen} />
      <Stack.Screen name='ForgotPassword' component={ForgotPasswordScreen} />
      <Stack.Screen name='ForgotEmail' component={ForgotEmailScreen} />
      <Stack.Screen name='OnboardingGoals' component={OnboardingGoalsScreen} />
      <Stack.Screen name='OnboardingSetTargets' component={OnboardingSetTargetsScreen} />
      <Stack.Screen name='ResumeIngestion' component={ResumeIngestionScreen} />
      <Stack.Screen name='Dashboard' component={DashboardScreen} />
      <Stack.Screen name='JobDetails' component={JobDetailsScreen} />
      <Stack.Screen name='OutreachCenter' component={OutreachCenterScreen} />
      <Stack.Screen name='JobTracker' component={JobTrackerScreen} />
      <Stack.Screen name='LinkedInKit' component={LinkedInKitScreen} />
      <Stack.Screen name='MockInterview' component={MockInterviewScreen} />
      <Stack.Screen name='AIOnboarding' component={AIOnboardingScreen} />
      <Stack.Screen name='ATSResults' component={ATSResultsScreen} />
      <Stack.Screen name='WeeklyDigest' component={WeeklyDigestScreen} />
      <Stack.Screen name='SettingsProfile' component={SettingsProfileScreen} />
      <Stack.Screen name='AccountSecurity' component={AccountSecurityScreen} />
      <Stack.Screen name='NotificationsPreferences' component={NotificationsPreferencesScreen} />
      <Stack.Screen name='DocumentsInsights' component={DocumentsInsightsScreen} />
      {__DEV__ ? <Stack.Screen name='MonetizationPrompts' component={MonetizationPromptsScreen} /> : null}
      <Stack.Screen name='UpdateEmail' component={UpdateEmailScreen} />
      <Stack.Screen name='UpdatePassword' component={UpdatePasswordScreen} />
      <Stack.Screen name='MainTabs' component={CareerLiftTabs} />
      <Stack.Screen name='ApplyPack' component={ApplyPackScreen} />
      <Stack.Screen name='InterviewPrep' component={InterviewPrepScreen} />
    </Stack.Navigator>
  )
}
