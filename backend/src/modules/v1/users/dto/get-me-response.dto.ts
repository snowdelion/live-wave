import { ApiProperty } from '@nestjs/swagger'

export class GetMeResponseDto {
  @ApiProperty({ example: 'user@example.com', nullable: true })
  email!: string | null

  @ApiProperty({ example: '123456789', nullable: true })
  telegramId!: string | null

  @ApiProperty({ example: 'my_username', nullable: true })
  username!: string | null

  @ApiProperty({ example: '2026-07-07T15:36:23.305Z' })
  createdAt!: string

  @ApiProperty({ example: true })
  isNotificationEnabled!: boolean

  @ApiProperty({ example: 2 })
  monitorsCount!: number

  @ApiProperty({ example: 168 })
  checksCount!: number
}
