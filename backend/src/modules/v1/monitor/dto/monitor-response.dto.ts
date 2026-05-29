import { ApiProperty } from '@nestjs/swagger'
import { Method, StatusEnum } from '@prisma/client'

export class MonitorResponseDto {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string

  @ApiProperty({ example: 'example' })
  name!: string

  @ApiProperty({ example: 'https://example.com' })
  url!: string

  @ApiProperty({ enum: Method, example: 'HEAD' })
  method!: Method

  @ApiProperty({ example: 10 })
  checkInterval!: number

  @ApiProperty({ example: 5000 })
  timeout!: number

  @ApiProperty({ enum: StatusEnum, nullable: true, example: null })
  lastStatus!: StatusEnum | null

  @ApiProperty({ example: 'b052a0fc-e3f0-4a7f-8d61-152f585aeea1' })
  clientId!: string

  @ApiProperty({ example: '2026-05-28T13:32:31.193Z' })
  createdAt!: Date

  @ApiProperty({ example: '2026-05-28T13:32:31.193Z' })
  updatedAt!: Date
}
