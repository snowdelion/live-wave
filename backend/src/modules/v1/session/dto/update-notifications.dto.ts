import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

export class UpdateNotificationsDto {
  @ApiProperty({
    example: true,
    description: 'If true, the user will receive notifications via telegram bot',
  })
  @IsBoolean()
  notifyTelegram!: boolean
}
