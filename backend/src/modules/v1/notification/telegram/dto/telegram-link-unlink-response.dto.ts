import { ApiProperty } from '@nestjs/swagger'

export class TelegramLinkResponseDto {
  @ApiProperty({
    example: 'https://t.me/your_bot_username?start=a1b2c3d4e5f6',
    description:
      'Link to the Telegram bot. The user clicks it and sends the `/start` command with the token',
  })
  link!: string
}

export class TelegramUnlinkResponseDto {
  @ApiProperty({
    example: 'You have unsubscribed from Telegram notifications',
    description: 'Message about the result of the operation',
  })
  message!: string
}
