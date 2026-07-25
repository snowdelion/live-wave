import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator'

export interface TelegramApiResponse<T = unknown> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

export class WebhookInfo {
  @ApiProperty({
    example: 'https://api.example.com/webhook',
    description: 'Current webhook URL',
  })
  @IsUrl()
  url!: string

  @ApiProperty({
    example: false,
    description: 'Whether a custom certificate is used',
  })
  @IsBoolean()
  has_custom_certificate!: boolean

  @ApiProperty({
    example: 0,
    description: 'Number of pending updates waiting to be delivered',
  })
  @IsNumber()
  pending_update_count!: number

  @ApiPropertyOptional({
    example: 1000000000,
    description: 'Timestamp of the last error',
  })
  last_error_date?: number

  @ApiPropertyOptional({
    example: 'Wrong response from the webhook: 502 Bad Gateway',
    description: 'Last error message',
  })
  @IsOptional()
  @IsString()
  last_error_message?: string

  @ApiPropertyOptional({
    example: 40,
    description: 'Maximum allowed concurrent connections',
  })
  @IsOptional()
  @IsNumber()
  max_connections?: number

  @ApiPropertyOptional({
    example: ['message', 'callback_query'],
    description: 'List of update types that are allowed',
  })
  @IsOptional()
  @IsArray()
  allowed_updates?: string[]
}
