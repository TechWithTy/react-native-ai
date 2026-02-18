const React = require('react')
const { Text } = require('react-native')

const MockIcon = ({ name, testID }) => 
  React.createElement(Text, { testID: testID || name }, name || 'Icon')

module.exports = {
  __esModule: true,
  default: MockIcon,
  Feather: MockIcon,
  MaterialIcons: MockIcon,
  Ionicons: MockIcon,
  FontAwesome: MockIcon,
}
