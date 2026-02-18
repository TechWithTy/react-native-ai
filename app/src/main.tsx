import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { CareerLift } from './screens'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { ThemeContext } from './context'

function MainComponent() {
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const styles = getStyles({ theme, insets })
  
  return (
    <View style={styles.container}>
      <CareerLift />
    </View>
  );
}

export function Main() {
  return (
    <SafeAreaProvider>
      <MainComponent />
    </SafeAreaProvider>
  )
}

const getStyles = ({ theme, insets } : { theme: any, insets: any}) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },
})
