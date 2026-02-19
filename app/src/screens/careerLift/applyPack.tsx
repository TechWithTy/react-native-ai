import * as React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { JobEntry } from '../../store/jobTrackerStore'
import { ApplicationPrepOptions } from './components/applicationPrepOptions'
import { CLTheme } from './theme'

type ApplyPackRouteParams = {
  job?: JobEntry
}

type ApplyPackProps = {
  route?: {
    params?: ApplyPackRouteParams
  }
}

export function ApplyPackScreen({ route }: ApplyPackProps = {}) {
  const navigation = useNavigation<any>()
  const job = route?.params?.job ?? null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name='chevron-left' size={28} color={CLTheme.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Package</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ApplicationPrepOptions
          job={job}
          showHeader={false}
          showCancel={false}
          initialTab='simple'
          onApplied={() => navigation.goBack()}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    backgroundColor: 'rgba(16, 23, 34, 0.95)',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
})
