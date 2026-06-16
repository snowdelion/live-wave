import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class TelegramWithChatIdDto {
  @ApiProperty({
    description: 'Telegram chat ID (numeric string) where notifications will be sent',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  chatId!: string
}
