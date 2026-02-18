import React from 'react'
import {
  Modal,
  ModalProps,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

type ModalContainerProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  backdropTestID?: string
  closeOnBackdropPress?: boolean
  animationType?: ModalProps['animationType']
}

export function ModalContainer({
  visible,
  onClose,
  children,
  backdropTestID,
  closeOnBackdropPress = true,
  animationType = 'fade',
}: ModalContainerProps) {
  const handleBackdropPress = () => {
    if (!closeOnBackdropPress) return
    onClose()
  }

  return (
    <Modal visible={visible} animationType={animationType} transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay} testID={backdropTestID}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.content}>{children}</View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
  },
})
