import { ApiProperty } from '@nestjs/swagger'

import { TelegramLinkUnlinkResponseDto } from './telegram-link-unlink-response.dto'

export class TelegramAlertResponseDto extends TelegramLinkUnlinkResponseDto {
  @ApiProperty({
    example: true,
    description: 'Current notification status for the client (enabled/disabled)',
  })
  enabled!: boolean
}
