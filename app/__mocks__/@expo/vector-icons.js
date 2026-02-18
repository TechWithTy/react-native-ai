const React = require('react')
const { View } = require('react-native')

const MockIcon = (props) => React.createElement(View, { ...props, testID: props.testID || props.name || 'icon' })

const createIconSet = () => MockIcon

module.exports = {
  createIconSet,
  Entypo: MockIcon,
  EvilIcons: MockIcon,
  Feather: MockIcon,
  FontAwesome: MockIcon,
  FontAwesome5: MockIcon,
  Foundation: MockIcon,
  Ionicons: MockIcon,
  MaterialCommunityIcons: MockIcon,
  MaterialIcons: MockIcon,
  Octicons: MockIcon,
  SimpleLineIcons: MockIcon,
  Zocial: MockIcon,
  AntDesign: MockIcon,
  __esModule: true,
  default: MockIcon,
}
