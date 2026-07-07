import { HttpStatus } from '@nestjs/common'

import { TelegramAlertResponseDto } from './dto/telegram-alert-response.dto'
import { TelegramLinkUnlinkResponseDto } from './dto/telegram-link-unlink-response.dto'
import { TelegramSettingsResponseDto } from './dto/telegram-settings-response.dto'
import { TelegramWithChatIdDto } from './dto/telegram-with-chat-id.dto'

export const linkTelegramDocs = {
  summary: 'Link Telegram chat to receive notifications',
  description:
    'Associates a Telegram chat ID with the current user. After linking, the user will receive notifications about monitor status changes',
  bodyType: TelegramWithChatIdDto,
  extraResponses: [
    {
      status: HttpStatus.CREATED,
      description: 'Chat linked successfully',
      type: TelegramLinkUnlinkResponseDto,
    },
  ],
}

export const unlinkTelegramDocs = {
  summary: 'Unlink Telegram chat',
  description:
    'Removes the association between the current user and a Telegram chat. Notifications will no longer be sent to this chat',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'Chat unlinked successfully',
      type: TelegramLinkUnlinkResponseDto,
    },
  ],
}

export const toggleAlertTelegramDocs = {
  summary: 'Enable or disable Telegram notifications',
  description:
    'Toggles notification delivery for the current user. If enabled, the user will receive alerts when monitor status changes (up/down)',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'Notification status toggled successfully',
      type: TelegramAlertResponseDto,
    },
  ],
}

export const settingsTelegramDocs = {
  summary: 'Get current Telegram notification status',
  description: 'Returns the enabled/disabled state of Telegram alerts for the authenticated user',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'Returns alert settings successfully',
      type: TelegramSettingsResponseDto,
    },
  ],
}
