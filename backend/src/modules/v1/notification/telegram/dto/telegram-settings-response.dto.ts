import { ApiProperty } from '@nestjs/swagger'

export class TelegramSettingsResponseDto {
  @ApiProperty({
    example: false,
    description: 'Current notification status for the client (enabled/disabled)',
  })
  enabled!: boolean

  @ApiProperty({
    example: true,
    description: 'Returns `true` if Telegram chat ID is specified. Otherwise returns `false`',
  })
  hasChat!: boolean
}
