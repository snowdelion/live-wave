import { useState } from 'react'

import { useLogout } from '@/entities/auth'
import {
  useLinkTelegram,
  useNotificationSettings,
  useToggleAlert,
  useUnlinkTelegram,
} from '@/entities/notification'
import { useDeleteUser, useUser } from '@/entities/users'

export function useUserPopover() {
  const { data: user } = useUser()
  const { data: settings } = useNotificationSettings()
  const { mutate: deleteUser } = useDeleteUser()
  const { mutate: logout } = useLogout()
  const { mutate: toggleAlert } = useToggleAlert()
  const { mutate: linkTelegram, error } = useLinkTelegram()
  const { mutate: unlinkTelegram } = useUnlinkTelegram()

  const hasTelegram = settings?.hasChat ?? false
  const isNotificationEnabled = settings?.enabled ?? false

  const [showConfirm, setShowConfirm] = useState(false)
  const [accountName, setAccountName] = useState<string>('')

  const PANEL_BUTTONS = [
    {
      label: hasTelegram ? 'Unlink Telegram' : 'Link Telegram',
      shouldShow: true,
      action: hasTelegram ? unlinkTelegram : linkTelegram,
      isDanger: false,
      shouldShowConfirm: false,
    },
    {
      label: isNotificationEnabled ? 'Disable Notifications' : 'Enable Notifications',
      shouldShow: hasTelegram,
      action: toggleAlert,
      isDanger: false,
      shouldShowConfirm: false,
    },
    {
      label: 'Delete Account',
      shouldShow: true,
      action: deleteUser,
      isDanger: true,
      shouldShowConfirm: true,
    },
    {
      label: 'Log Out',
      shouldShow: true,
      action: logout,
      isDanger: true,
      shouldShowConfirm: false,
    },
  ]

  const handleDeleteClick = () => {
    setAccountName(user?.email || user?.username || 'Account')
    setShowConfirm(true)
  }

  return {
    PANEL_BUTTONS,
    handleDeleteClick,
    showConfirm,
    setShowConfirm,
    accountName,
    error,
    user,
  }
}
