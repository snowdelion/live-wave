import { ApiProperty } from '@nestjs/swagger'

export class TelegramAlertResponseDto {
  @ApiProperty({
    example: true,
    description: 'Current notification status for the user (enabled/disabled)',
  })
  enabled!: boolean

  @ApiProperty({
    example: 'You have enabled Telegram notifications',
    description: 'Message about the result of the operation',
  })
  message!: string
}
