import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import { DashboardScreen } from './dashboard'
import { JobTrackerScreen } from './jobTracker'
import { RecommendedJobsScreen } from './recommendedJobs'
import { SettingsProfileScreen } from './settingsProfile'
import { AICoachScreen } from './aiCoach'
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
        name="AICoach"
        component={AICoachScreen}
        options={{
          tabBarLabel: 'AI Coach',
          tabBarIcon: () => (
            <View style={styles.aiCoachIconBubble}>
              <MaterialIcons name="smart-toy" size={21} color="#fff" />
            </View>
          ),
          tabBarButton: ({
            children,
            style,
            delayLongPress,
            onPress,
            onLongPress,
            accessibilityLabel,
            accessibilityRole,
            accessibilityState,
            accessibilityValue,
            testID,
            disabled,
          }: BottomTabBarButtonProps) => (
            <TouchableOpacity
              onPress={onPress ?? undefined}
              onLongPress={onLongPress ?? undefined}
              accessibilityLabel={accessibilityLabel ?? undefined}
              accessibilityRole={accessibilityRole ?? 'button'}
              accessibilityState={accessibilityState ?? undefined}
              accessibilityValue={accessibilityValue ?? undefined}
              testID={testID ?? undefined}
              disabled={disabled ?? false}
              delayLongPress={delayLongPress ?? undefined}
              activeOpacity={0.9}
              style={[style, styles.aiCoachTabButton]}
            >
              {children}
            </TouchableOpacity>
          ),
          tabBarLabelStyle: styles.aiCoachLabel,
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
    height: 66,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -4,
  },
  aiCoachTabButton: {
    marginTop: -8,
  },
  aiCoachIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CLTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: CLTheme.background,
    shadowColor: CLTheme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginTop: -18,
  },
  aiCoachLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
})
