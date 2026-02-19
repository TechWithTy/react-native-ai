import 'react-native-gesture-handler'
import { ComponentType, SetStateAction, useState, useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import * as themes from './src/theme'
import { IMAGE_MODELS, MODELS } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal } from './src/components/index'
import { Model } from './types'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { DevSettings, StyleSheet, LogBox } from 'react-native'
import { useAIAgentsStore } from './src/store/aiAgentsStore'

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const [theme, setTheme] = useState<string>('dark')
  const [MainComponent, setMainComponent] = useState<ComponentType | null>(null)
  const [isBootstrapped, setIsBootstrapped] = useState(false)
  const [chatType, setChatType] = useState<Model>(MODELS.claudeOpus)
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS.nanoBanana.label)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
    const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf')
  })

  useEffect(() => {
    void configureStorage()
  }, [])

  async function configureStorage() {
    try {
      const _theme = await AsyncStorage.getItem('rnai-theme')
      const resolvedTheme = _theme && getTheme(_theme) ? _theme : 'dark'
      ;(globalThis as any).__RNAI_THEME_NAME = resolvedTheme
      setTheme(resolvedTheme)
      const _chatType = await AsyncStorage.getItem('rnai-chatType')
      let resolvedChatType = MODELS.claudeOpus
      if (_chatType) {
        resolvedChatType = JSON.parse(_chatType)
        setChatType(resolvedChatType)
      }
      useAIAgentsStore.getState().setSelectedModelLabel(resolvedChatType.label)
      const _imageModel = await AsyncStorage.getItem('rnai-imageModel')
      if (_imageModel) setImageModel(_imageModel)
      const mainModule = await import('./src/main')
      setMainComponent(() => mainModule.Main)
      setIsBootstrapped(true)
    } catch (err) {
      console.log('error configuring storage', err)
      const mainModule = await import('./src/main')
      setMainComponent(() => mainModule.Main)
      setIsBootstrapped(true)
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  function closeModal() {
    bottomSheetModalRef.current?.dismiss()
    setModalVisible(false)
  }

  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal()
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  }

  function _setChatType(type) {
    setChatType(type)
    AsyncStorage.setItem('rnai-chatType', JSON.stringify(type))
    useAIAgentsStore.getState().setSelectedModelLabel(type.label)
  }

  function _setImageModel(model) {
    setImageModel(model)
    AsyncStorage.setItem('rnai-imageModel', model)
  }

  async function reloadForThemeChange() {
    const isTestEnv = typeof process !== 'undefined' && Boolean(process.env?.JEST_WORKER_ID)
    if (isTestEnv) return

    try {
      const Updates = require('expo-updates')
      if (typeof Updates?.reloadAsync === 'function') {
        await Updates.reloadAsync()
        return
      }
    } catch {
      // Fall back to DevSettings reload in dev.
    }

    DevSettings.reload()
  }

  function _setTheme(nextThemeAction: SetStateAction<string>) {
    const nextTheme =
      typeof nextThemeAction === 'function'
        ? nextThemeAction(theme)
        : nextThemeAction
    if (nextTheme === theme) return
    setTheme(nextTheme)
    ;(globalThis as any).__RNAI_THEME_NAME = nextTheme
    AsyncStorage.setItem('rnai-theme', nextTheme)
    void reloadForThemeChange()
  }

  const bottomSheetStyles = getBottomsheetStyles(getTheme(theme))

  if (!fontsLoaded || !isBootstrapped || !MainComponent) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContext.Provider
        value={{
          chatType,
          setChatType: _setChatType,
          handlePresentModalPress,
          imageModel,
          setImageModel: _setImageModel,
          closeModal,
        }}
      >
        <ThemeContext.Provider value={{
          theme: getTheme(theme),
          themeName: theme,
          setTheme: _setTheme
          }}>
          <ActionSheetProvider>
            <NavigationContainer>
              <MainComponent />
            </NavigationContainer>
          </ActionSheetProvider>
          <BottomSheetModalProvider>
            <BottomSheetModal
                handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                handleStyle={bottomSheetStyles.handle}
                backgroundStyle={bottomSheetStyles.background}
                ref={bottomSheetModalRef}
                enableDynamicSizing={true}
                backdropComponent={(props) => <BottomSheetBackdrop {...props}  disappearsOnIndex={-1}/>}
                enableDismissOnClose
                enablePanDownToClose
                onDismiss={() => setModalVisible(false)}
              >
                <BottomSheetView>
                  <ChatModelModal
                    handlePresentModalPress={handlePresentModalPress}
                  />
                </BottomSheetView>
              </BottomSheetModal>
            </BottomSheetModalProvider>
        </ThemeContext.Provider>
      </AppContext.Provider>
    </GestureHandlerRootView>
  )
}

const getBottomsheetStyles = theme => StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    backgroundColor: theme.backgroundColor
  },
  handle: {
    marginHorizontal: 15,
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: theme.borderColor
  }
})

function getTheme(theme: any) {
  const target = typeof theme === 'string' ? theme : ''
  const resolved = Object.values(themes).find(candidate => candidate.label === target)
  return resolved || themes.darkTheme
}
