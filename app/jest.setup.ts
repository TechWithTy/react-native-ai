import 'react-native-gesture-handler/jestSetup'

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

jest.mock('@expo/vector-icons/Feather', () => {
  const React = require('react')
  const { Text } = require('react-native')
  const MockFeather = ({ name }: { name?: string }) => React.createElement(Text, null, name || 'icon')
  return {
    __esModule: true,
    default: MockFeather,
  }
})

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  const MockMaterialIcons = ({ name }: { name?: string }) => React.createElement(Text, null, name || 'icon')
  return {
    __esModule: true,
    default: MockMaterialIcons,
  }
})
