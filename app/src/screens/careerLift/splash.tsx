import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { ThemeContext } from '../../context'

export function SplashScreen({ navigation }: any) {
  const { theme } = useContext(ThemeContext)
  const isDark = theme?.backgroundColor === '#000'
  const styles = getStyles(isDark)

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />

      <View style={styles.topSpacer} />

      <View style={styles.center}>
        <View style={styles.logoHalo} />
        <View style={styles.logo}>
          <MaterialIcons name='trending-up' size={48} color='#fff' />
        </View>

        <Text style={styles.title}>Career Lift</Text>
        <Text style={styles.tagline}>Your career, escalated.</Text>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('OnboardingGoals')}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <MaterialIcons name='arrow-forward' size={16} color='#fff' />
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.version}>v1.0.4</Text>
        </View>
      </View>
    </View>
  )
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? '#101722' : '#f5f7f8',
      position: 'relative',
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -80,
      left: -30,
      right: -30,
      height: 380,
      borderRadius: 9999,
      backgroundColor: 'rgba(13,108,242,0.16)',
      opacity: isDark ? 0.6 : 0.8,
    },
    topSpacer: {
      height: 48,
      width: '100%',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -80,
      paddingHorizontal: 24,
    },
    logoHalo: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(13,108,242,0.2)',
      top: '50%',
      marginTop: -140,
    },
    logo: {
      width: 96,
      height: 96,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0d6cf2',
      shadowColor: '#0d6cf2',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 5,
    },
    title: {
      marginTop: 28,
      fontSize: 40,
      fontWeight: '700',
      color: isDark ? '#fff' : '#111827',
      letterSpacing: -0.5,
    },
    tagline: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: '300',
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    bottomArea: {
      width: '100%',
      paddingHorizontal: 24,
      paddingBottom: 48,
      alignItems: 'center',
      gap: 22,
    },
    cta: {
      width: '100%',
      maxWidth: 380,
      borderRadius: 10,
      backgroundColor: '#0d6cf2',
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#0d6cf2',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 4,
    },
    ctaText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    footer: {
      alignItems: 'center',
      gap: 8,
    },
    progressTrack: {
      width: 128,
      height: 4,
      borderRadius: 999,
      backgroundColor: isDark ? '#1f2937' : '#e5e7eb',
      overflow: 'hidden',
    },
    progressFill: {
      width: '33%',
      height: '100%',
      borderRadius: 999,
      backgroundColor: 'rgba(13,108,242,0.6)',
    },
    version: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#4b5563' : '#9ca3af',
    },
  })

