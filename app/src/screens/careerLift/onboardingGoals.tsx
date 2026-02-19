import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as Location from 'expo-location'
import { getRoleOptionsForTrack, useCareerSetupStore } from '../../store/careerSetup'
import { useUserProfileStore } from '../../store/userProfileStore'
import { ROLE_TRACKS_META } from '../../data/roles'
import { TARGET_SENIORITY_OPTIONS } from '../../data/seniority'
import { USER_WORKING_STYLES } from '../../data/workingStyle'
import { ModalContainer } from './components/modalContainer'
import { LocationAutocomplete } from './components/locationAutocomplete'

export function OnboardingGoalsScreen({ navigation }: any) {
  const roleTrack = useCareerSetupStore(state => state.roleTrack)
  const targetSeniority = useCareerSetupStore(state => state.targetSeniority)
  const locationPreference = useCareerSetupStore(state => state.locationPreference)
  const setCareerSetup = useCareerSetupStore(state => state.setCareerSetup)
  const currentLocation = useUserProfileStore(state => state.currentLocation)
  const setProfile = useUserProfileStore(state => state.setProfile)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  const selectRoleTrack = useCallback(
    (nextTrack: string) => {
      const roleOptions = getRoleOptionsForTrack(nextTrack)
      setCareerSetup({
        roleTrack: nextTrack,
      })
    },
    [setCareerSetup]
  )

  const resetCareerSetup = useCareerSetupStore(state => state.resetCareerSetup)

  // Force a fresh start when entering the onboarding flow to ensure no pre-selected options.
  useEffect(() => {
    resetCareerSetup()
    setProfile({ currentLocation: '' })
  }, [])

  useEffect(() => {
    setLocationInput(currentLocation || '')
  }, [currentLocation])

  const needsLocation = locationPreference === 'Hybrid' || locationPreference === 'On-site'
  const isLocationValid = currentLocation && currentLocation.trim().length > 0
  const isRoleSelected = roleTrack.trim().length > 0
  const isSenioritySelected = targetSeniority.trim().length > 0
  const isWorkingStyleSelected = locationPreference.trim().length > 0

  const canProceed = isRoleSelected && isSenioritySelected && isWorkingStyleSelected && (!needsLocation || isLocationValid)

  const formatGpsLocation = (
    latitude: number,
    longitude: number,
    geo?: { city?: string | null; region?: string | null; district?: string | null }
  ) => {
    if (geo?.city && geo?.region) return `${geo.city}, ${geo.region}`
    if (geo?.city && geo?.district) return `${geo.city}, ${geo.district}`
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true)
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('Location Permission Needed', 'Allow location access to auto-fill your current location.')
        return
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const geocoded = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      })

      const formatted = formatGpsLocation(
        coords.coords.latitude,
        coords.coords.longitude,
        geocoded?.[0]
          ? {
              city: geocoded[0].city,
              region: geocoded[0].region,
              district: geocoded[0].district,
            }
          : undefined
      )

      setLocationInput(formatted)
      setProfile({ currentLocation: formatted })
      setShowLocationModal(false)
    } catch {
      Alert.alert('Unable to detect location', 'Try searching and selecting a location manually.')
    } finally {
      setIsLocating(false)
    }
  }

  const handleWorkingStyleSelect = (label: string, legacy: string) => {
    setCareerSetup({
      locationPreference: label,
      workingStyle: legacy,
    })

    if (label === 'Hybrid' || label === 'On-site') {
      setShowLocationModal(true)
    }
  }

  return (
    <View style={styles.screen}>
      {/* Status Bar Placeholder */}
      <View style={styles.statusBar} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#64748b" />
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
                  onPress={() => handleWorkingStyleSelect(option.label, option.legacy)}
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
          onPress={() => {
            if (canProceed) navigation.navigate('OnboardingSetTargets')
          }}
          style={[
            styles.cta,
            { opacity: canProceed ? 1 : 0.5, backgroundColor: canProceed ? '#0d6cf2' : '#334155' }
          ]}
          disabled={!canProceed}
          activeOpacity={0.9}
        >
          <Text style={[styles.ctaText, { color: canProceed ? '#fff' : '#94a3b8' }]}>Next Step</Text>
          {canProceed && <MaterialIcons name="arrow-forward" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ModalContainer
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        animationType='fade'
        backdropTestID='onboarding-location-modal-backdrop'
      >
        <View style={[styles.modalCard, styles.locationModalCard]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Your Preferred Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <MaterialIcons name='close' size={22} color='#94a3b8' />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.locationModalScroll}
            contentContainerStyle={styles.locationModalScrollContent}
            keyboardShouldPersistTaps='handled'
          >
            <Text style={styles.modalSubtitle}>
              You selected a hybrid or on-site work style. Add your preferred location.
            </Text>
            <Text style={styles.locationSectionLabel}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.gpsLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
              accessibilityLabel='Use current location GPS'
            >
              {isLocating ? (
                <ActivityIndicator size='small' color='#0d6cf2' />
              ) : (
                <Feather name='crosshair' size={14} color='#0d6cf2' />
              )}
              <Text style={styles.gpsLocationButtonText}>
                {isLocating ? 'Detecting current location...' : 'Use Current Location (GPS)'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.locationSectionLabel}>Suggested Locations</Text>
            <LocationAutocomplete
              value={locationInput}
              onChangeText={setLocationInput}
              onSelect={setLocationInput}
              currentLocation={currentLocation}
              placeholder='City, State or Remote'
              containerStyle={styles.locationAutocompleteContainer}
              inputContainerStyle={styles.locationInputContainer}
              inputStyle={styles.textInput}
              suggestionsContainerStyle={styles.locationResultsContainer}
              suggestionRowStyle={styles.locationSuggestionRow}
              suggestionTextStyle={styles.locationSuggestionText}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLocationModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                const trimmedLocation = locationInput.trim()
                if (!trimmedLocation) {
                  Alert.alert('Missing Location', 'Enter a location before saving.')
                  return
                }
                setProfile({ currentLocation: trimmedLocation })
                setShowLocationModal(false)
              }}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalContainer>
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
  modalCard: {
    backgroundColor: '#172335',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#223249',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#cbd5e1',
    marginBottom: 14,
  },
  locationAutocompleteContainer: {
    zIndex: 20,
    marginBottom: 10,
  },
  locationModalCard: {
    maxHeight: '86%',
  },
  locationModalScroll: {
    maxHeight: 360,
  },
  locationModalScrollContent: {
    paddingBottom: 6,
  },
  locationSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  gpsLocationButton: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#223249',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsLocationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  textInput: {
    color: '#f8fafc',
    fontSize: 14,
    paddingVertical: 10,
  },
  locationInputContainer: {
    backgroundColor: '#0f172a',
    borderColor: '#223249',
  },
  locationResultsContainer: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 10,
    backgroundColor: '#0f172a',
    maxHeight: 200,
    overflow: 'hidden',
  },
  locationSuggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#223249',
  },
  locationSuggestionText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#0d6cf2',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
})
