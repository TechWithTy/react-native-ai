import { StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { CLTheme } from '../theme'

type SearchableInputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  containerStyle?: StyleProp<ViewStyle>
}

export function SearchableInput({
  value,
  onChangeText,
  placeholder,
  containerStyle,
}: SearchableInputProps) {
  return (
    <View style={[styles.searchWrap, containerStyle]}>
      <Feather name='search' size={16} color={CLTheme.text.secondary} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={CLTheme.text.muted}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: CLTheme.text.primary,
    fontSize: 14,
    paddingVertical: 8,
  },
})
