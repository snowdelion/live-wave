import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

class TelegramUser {
  @ApiProperty({ example: 123456789, description: 'User ID' })
  @IsNumber()
  id!: number

  @ApiProperty({ example: false, description: 'Whether this user is a bot' })
  @IsBoolean()
  is_bot!: boolean

  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsOptional()
  @IsString()
  first_name?: string

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsOptional()
  @IsString()
  last_name?: string

  @ApiPropertyOptional({ example: 'johndoe', description: "User's Telegram username" })
  @IsOptional()
  @IsString()
  username?: string

  @ApiPropertyOptional({ example: 'en', description: "User's language code" })
  @IsOptional()
  @IsString()
  language_code?: string
}

class TelegramChat {
  @ApiProperty({ example: 123456789, description: 'User ID' })
  @IsNumber()
  id!: number

  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsOptional()
  @IsString()
  first_name?: string

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsOptional()
  @IsString()
  last_name?: string

  @ApiPropertyOptional({ example: 'johndoe', description: "User's Telegram username" })
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({
    example: 'private',
    description: 'Chat type',
  })
  @IsString()
  type!: string
}

class TelegramEntity {
  @ApiProperty({ example: 0, description: 'Offset in UTF-16 code units' })
  @IsNumber()
  offset!: number

  @ApiProperty({ example: 4, description: 'Length of the entity' })
  @IsNumber()
  length!: number

  @ApiProperty({
    example: 'bot_command',
    description: 'Type of entity',
  })
  @IsString()
  type!: string
}

class TelegramMessage {
  @ApiProperty({ example: 123, description: 'Unique message ID' })
  @IsNumber()
  message_id!: number

  @ApiProperty({ type: TelegramUser, description: 'Sender of the message' })
  from!: TelegramUser
  @ApiProperty({ type: TelegramChat, description: 'Chat where the message was sent' })
  chat!: TelegramChat

  @ApiProperty({ example: 1000000000, description: 'Timestamp of the message' })
  @IsNumber()
  date!: number

  @ApiPropertyOptional({
    example: '/start abc123',
    description: 'Text of the message',
  })
  @IsString()
  @IsOptional()
  text?: string

  @ApiPropertyOptional({
    type: TelegramEntity,
    isArray: true,
    description: 'Entities inside the text',
  })
  @IsOptional()
  entities?: TelegramEntity[]
}

export class TelegramWebhookDto {
  @ApiPropertyOptional({ example: 123456789, description: 'Unique ID' })
  @IsNumber()
  @IsOptional()
  update_id?: number

  @ApiPropertyOptional({ type: TelegramMessage, description: 'Message object' })
  @IsOptional()
  message?: TelegramMessage
}
