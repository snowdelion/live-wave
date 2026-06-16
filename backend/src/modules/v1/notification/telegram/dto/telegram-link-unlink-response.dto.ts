import { ApiProperty } from '@nestjs/swagger'

export class TelegramLinkUnlinkResponseDto {
  @ApiProperty({
    example: 'You will receive notifications when your monitor status changes',
    description: 'Message about the result of the operation',
  })
  message!: string
}
