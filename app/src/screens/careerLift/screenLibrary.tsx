import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { careerLiftRoutes } from './routes'
import { ScreenTitle, useStyles } from './shared'
import { CLTheme } from './theme'

export function ScreenLibrary({ navigation }: any) {
  const styles = useStyles()
  return (
    <View style={styles.screen}>
      <ScreenTitle title='Career Lift Screens' subtitle='React Native setup' />
      <ScrollView contentContainerStyle={styles.content}>
        {careerLiftRoutes.map(route => (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.key)}
            activeOpacity={0.85}
            style={styles.card}
          >
            <View style={styles.listRow}>
              <Text style={styles.sectionTitle}>{route.label}</Text>
              <Feather name='chevron-right' size={16} color={CLTheme.text.secondary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}
