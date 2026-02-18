
import { useCallback } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { getRoleOptionsForTrack, useCareerSetupStore } from '../../store/careerSetup'
import { ROLE_TRACKS_META } from '../../data/roles'
import { TARGET_SENIORITY_OPTIONS } from '../../data/seniority'
import { USER_WORKING_STYLES } from '../../data/workingStyle'

export function OnboardingGoalsScreen({ navigation }: any) {
  const roleTrack = useCareerSetupStore(state => state.roleTrack)
  const targetSeniority = useCareerSetupStore(state => state.targetSeniority)
  const locationPreference = useCareerSetupStore(state => state.locationPreference)
  const setCareerSetup = useCareerSetupStore(state => state.setCareerSetup)

  const selectRoleTrack = useCallback(
    (nextTrack: string) => {
      const roleOptions = getRoleOptionsForTrack(nextTrack)
      setCareerSetup({
        roleTrack: nextTrack,
        targetRole: roleOptions[0],
      })
    },
    [setCareerSetup]
  )

  return (
    <View style={styles.screen}>
      {/* Status Bar Placeholder */}
      <View style={styles.statusBar} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('OnboardingSetTargets')}> 
            <Text style={styles.skipBtn}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
            <Text style={styles.stepText}><Text style={styles.stepHighlight}>Step 1 of 3</Text></Text>
            <Text style={styles.stepText}>33%</Text>
        </View>
        <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '33%' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Define Your Path</Text>
            <Text style={styles.headerSubtitle}>Let's tailor your experience. Tell us where you want to go so we can help you get there.</Text>
        </View>

        {/* Role Track Selection */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>WHICH TRACK BEST DESCRIBES YOU?</Text>
          <View style={styles.grid}>
            {ROLE_TRACKS_META.map(item => {
              const selected = roleTrack === item.label
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => selectRoleTrack(item.label)}
                  style={[styles.gridCard, selected && styles.gridCardSelected]}
                  activeOpacity={0.9}
                >
                  {selected && (
                      <View style={styles.checkIcon}>
                          <MaterialIcons name="check-circle" size={20} color="#0d6cf2" />
                      </View>
                  )}
                  <View style={[styles.roleIconWrap, { backgroundColor: item.bgColor ? '#1e293b' : '#334155' } ]}> 
                      {/* Note: In dark mode, we might simply stick to dark icon backgrounds rather than pastel colors unless we want a colorful dark mode. 
                          The HTML design used pastels. For dark mode consistency here, I'll use dark grays but color the icon. */}
                      <MaterialIcons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <Text style={[styles.gridCardText, selected && styles.gridCardTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Seniority Level Selection */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CURRENT SENIORITY</Text>
            <Text style={styles.selectionHint}>Select one</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seniorityRow}>
            {TARGET_SENIORITY_OPTIONS.map(option => {
              const selected = targetSeniority === option.label
              return (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() =>
                        setCareerSetup({
                        targetSeniority: option.label,
                        seniority: option.legacy,
                        })
                    }
                    style={[styles.seniorityPill, selected && styles.seniorityPillSelected]}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.seniorityPillText, selected && styles.seniorityPillTextSelected]}>{option.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Working Style Selection */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>PREFERRED WORKING STYLE</Text>
          <View style={styles.locationList}>
            {USER_WORKING_STYLES.map(option => {
              const selected = locationPreference === option.label
              return (
                <TouchableOpacity
                  key={option.label}
                  onPress={() =>
                    setCareerSetup({
                      locationPreference: option.label,
                      workingStyle: option.legacy,
                    })
                  }
                  style={[styles.locationCard, selected && styles.locationCardSelected]}
                  activeOpacity={0.9}
                >
                  <View style={styles.locationContent}>
                    <View style={styles.locationIconWrap}>
                        <MaterialIcons name={option.icon as any} size={22} color={option.color} />
                    </View>
                    <View style={styles.locationTextWrap}>
                        <Text style={[styles.locationLabel, selected && styles.locationLabelSelected]}>
                            {option.label}
                        </Text>
                        <Text style={styles.locationSubtitle}>{option.subtitle}</Text>
                    </View>
                  </View>
                  <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                      {selected && <MaterialIcons name="check" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OnboardingSetTargets')}
          style={styles.cta}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Next Step</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101722',
  },
  statusBar: {
      height: 44, // Placeholder for status bar
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -8,
  },
  skipBtn: {
      color: '#94a3b8', 
      fontSize: 14,
      fontWeight: '500', 
  },
  progressContainer: {
      paddingHorizontal: 24,
      marginBottom: 24,
  },
  progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  stepText: {
      color: '#64748b',
      fontSize: 12,
      fontWeight: '500',
  },
  stepHighlight: {
      color: '#0d6cf2',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#1e293b', // slate-800
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d6cf2',
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120, // space for footer
  },
  headerTitleWrap: {
      marginBottom: 32,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
      color: '#94a3b8',
      fontSize: 16,
      lineHeight: 24,
  },
  sectionWrap: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
      flexDirection: 'row', 
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 12,
  },
  sectionTitle: {
    color: '#e2e8f0', // slate-200
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  selectionHint: {
      color: '#0d6cf2',
      fontSize: 12,
      fontWeight: '500',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%', // roughly half
    height: 128, // h-32
    borderRadius: 16, // rounded-xl
    borderWidth: 1,
    borderColor: '#1e293b', // slate-800
    backgroundColor: '#0f172a', // slate-900 (slightly darker than bg) or just white for light mode
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridCardSelected: {
    borderColor: '#0d6cf2',
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
  },
  checkIcon: {
      position: 'absolute',
      top: 8,
      right: 8,
  },
  roleIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 999,
      backgroundColor: '#1e293b', 
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
  },
  gridCardText: {
    color: '#e2e8f0',
    fontWeight: '500',
    fontSize: 14,
  },
  gridCardTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Seniority Pills
  seniorityRow: {
    gap: 12,
    paddingRight: 24,
  },
  seniorityPill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1, 
      borderColor: '#1e293b',
      backgroundColor: '#0f172a',
  },
  seniorityPillSelected: {
      backgroundColor: '#0d6cf2',
      borderColor: '#0d6cf2',
  },
  seniorityPillText: {
      color: '#94a3b8',
      fontWeight: '500',
      fontSize: 14,
  },
  seniorityPillTextSelected: {
      color: '#fff',
  },

  // Location Cards
  locationList: {
      gap: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16, // rounded-xl
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  locationCardSelected: {
    borderColor: '#0d6cf2',
    backgroundColor: 'rgba(13, 108, 242, 0.05)',
  },
  locationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
  },
  locationIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10, // rounded-lg
      backgroundColor: '#1e293b',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  locationTextWrap: {
      flex: 1,
  },
  locationLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
  },
  locationLabelSelected: {
      color: '#fff',
  },
  locationSubtitle: {
      color: '#64748b',
      fontSize: 12,
      marginTop: 2,
  },
  radioCircle: {
      width: 20, 
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#475569',
      alignItems: 'center',
      justifyContent: 'center',
  },
  radioCircleSelected: {
      borderColor: '#0d6cf2',
      backgroundColor: '#0d6cf2',
  },

  // Footer
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    // Add gradient effect if possible, else solid bg
    backgroundColor: '#101722', 
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  cta: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0d6cf2',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d6cf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
})
