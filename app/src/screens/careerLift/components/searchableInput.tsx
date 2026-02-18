import { StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native'
import Feather from '@expo/vector-icons/Feather'

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
      <Feather name='search' size={16} color='#94a3b8' />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#64748b'
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#243244',
    backgroundColor: '#18212f',
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    paddingVertical: 8,
  },
})
