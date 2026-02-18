import React, { useMemo } from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { City, State as CountryState } from 'country-state-city'
import Feather from '@expo/vector-icons/Feather'

const MAX_LOCATION_SUGGESTIONS = 8
const DEFAULT_LOCATION_OPTIONS = [
  'Remote',
  'San Francisco, CA',
  'New York, NY',
  'Austin, TX',
  'Seattle, WA',
  'Los Angeles, CA',
  'Chicago, IL',
] as const

const US_STATE_META = CountryState.getStatesOfCountry('US')
const US_STATE_NAME_BY_CODE = new Map(US_STATE_META.map(item => [item.isoCode, item.name]))

const US_LOCATION_OPTIONS = (() => {
  const deduped = new Set<string>(DEFAULT_LOCATION_OPTIONS)
  City.getCitiesOfCountry('US').forEach(city => {
    if (!city.stateCode) return
    const stateName = US_STATE_NAME_BY_CODE.get(city.stateCode)
    deduped.add(`${city.name}, ${city.stateCode}`)
    if (stateName) deduped.add(`${city.name}, ${stateName}`)
  })
  return Array.from(deduped)
})()

type LocationAutocompleteProps = {
  value: string
  onChangeText: (text: string) => void
  onSelect: (location: string) => void
  currentLocation?: string
  placeholder?: string
  maxSuggestions?: number
  showSearchIcon?: boolean
  containerStyle?: StyleProp<ViewStyle>
  inputContainerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  suggestionsContainerStyle?: StyleProp<ViewStyle>
  suggestionRowStyle?: StyleProp<ViewStyle>
  suggestionTextStyle?: StyleProp<TextStyle>
}

const compactLocations = (items: Array<string | null | undefined>) =>
  items.filter((item): item is string => Boolean(item && item.trim().length > 0))

export function LocationAutocomplete({
  value,
  onChangeText,
  onSelect,
  currentLocation,
  placeholder = 'City, State or Remote',
  maxSuggestions = MAX_LOCATION_SUGGESTIONS,
  showSearchIcon = false,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  suggestionsContainerStyle,
  suggestionRowStyle,
  suggestionTextStyle,
}: LocationAutocompleteProps) {
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase()
    const baseOptions = Array.from(new Set(compactLocations([currentLocation, ...US_LOCATION_OPTIONS])))
    if (!query) return baseOptions.slice(0, maxSuggestions)

    const filtered = baseOptions.filter(option => option.toLowerCase().includes(query))
    if (filtered.length > 0) return filtered.slice(0, maxSuggestions)

    return baseOptions.slice(0, maxSuggestions)
  }, [value, currentLocation, maxSuggestions])

  return (
    <View style={containerStyle}>
      <View style={[styles.inputContainer, inputContainerStyle]}>
        {showSearchIcon ? <Feather name='search' size={16} color='#94a3b8' /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor='#64748b'
          autoCorrect={false}
          autoCapitalize='words'
        />
      </View>
      <View style={[styles.suggestionsContainer, suggestionsContainerStyle]}>
        {suggestions.map(item => (
          <TouchableOpacity key={item} style={[styles.suggestionRow, suggestionRowStyle]} onPress={() => onSelect(item)}>
            <Text style={[styles.suggestionText, suggestionTextStyle]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 10,
    backgroundColor: '#0f1722',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    paddingVertical: 10,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#223249',
    borderRadius: 10,
    backgroundColor: '#1a222e',
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#223249',
  },
  suggestionText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
})
