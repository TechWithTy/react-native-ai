import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { DashboardScreen } from './dashboard'
import { JobTrackerScreen } from './jobTracker'
import { OutreachCenterScreen } from './outreachCenter'
import { RecommendedJobsScreen } from './recommendedJobs'
import { SettingsProfileScreen } from './settingsProfile'
import { CLTheme } from './theme'

const Tab = createBottomTabNavigator()

export function CareerLiftTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: CLTheme.accent,
        tabBarInactiveTintColor: CLTheme.text.secondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="JobTracker"
        component={JobTrackerScreen}
        options={{
          tabBarLabel: 'Tracker',
          tabBarIcon: ({ color }) => <Feather name="trello" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="RecommendedJobs"
        component={RecommendedJobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color }) => <Feather name="briefcase" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsProfile"
        component={SettingsProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: CLTheme.card,
    borderTopWidth: 0,
    elevation: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -4,
  },
})
