import * as React from 'react'
import { NotificationItem } from './notificationsPanel'
import { careerLiftNotifications } from '../notificationsData'

type UseNotificationsPanelStateOptions = {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void
}

export function useNotificationsPanelState(options: UseNotificationsPanelStateOptions = {}) {
  const { onNavigate } = options
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(() => [...careerLiftNotifications])

  const openNotifications = React.useCallback(() => {
    setShowNotifications(true)
  }, [])

  const closeNotifications = React.useCallback(() => {
    setShowNotifications(false)
  }, [])

  const handleNotificationPress = React.useCallback(
    (item: NotificationItem) => {
      if (!item.target) return
      setShowNotifications(false)
      onNavigate?.(item.target.screen, item.target.params)
    },
    [onNavigate]
  )

  const handleClearNotification = React.useCallback((id: string) => {
    setNotifications(current => current.filter(item => item.id !== id))
  }, [])

  const handleClearAllNotifications = React.useCallback(() => {
    setNotifications([])
  }, [])

  return {
    showNotifications,
    notifications,
    openNotifications,
    closeNotifications,
    handleNotificationPress,
    handleClearNotification,
    handleClearAllNotifications,
  }
}

