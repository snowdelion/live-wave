import { HttpStatus } from '@nestjs/common'

import { TelegramAlertResponseDto } from './dto/telegram-alert-response.dto'
import {
  TelegramLinkResponseDto,
  TelegramUnlinkResponseDto,
} from './dto/telegram-link-unlink-response.dto'
import { TelegramSettingsResponseDto } from './dto/telegram-settings-response.dto'

export const linkTelegramDocs = {
  summary: 'Link Telegram chat to receive notifications',
  description:
    'Associates a Telegram chat ID with the current user. After linking, the user will receive notifications about monitor status changes',
  extraResponses: [
    {
      status: HttpStatus.CREATED,
      description: 'Chat linked successfully',
      type: TelegramLinkResponseDto,
    },
  ],
}

export const webhookDocs = {
  summary: 'Telegram webhook endpoint for receiving bot updates',
  description:
    'Called by Telegram automatically when users interact with the bot. It processes commands like `/start` and updates user settings',
  extraResponses: [
    {
      status: HttpStatus.OK,
      description: 'Update processed successfully',
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
      type: TelegramUnlinkResponseDto,
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
