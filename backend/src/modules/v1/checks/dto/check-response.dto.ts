import { ApiProperty } from '@nestjs/swagger'
import { StatusEnum } from '@prisma/client'

export class CheckResponseDto {
  @ApiProperty({ example: 'ck3kq1t7x0000u1w6p8x1f1c2' })
  id!: string

  @ApiProperty({ example: 'up', enum: StatusEnum })
  status!: StatusEnum

  @ApiProperty({ example: 200, nullable: true })
  statusCode!: number | null

  @ApiProperty({ example: 1000, nullable: true })
  responseTime!: number | null

  @ApiProperty({ example: null, nullable: true })
  error!: string | null

  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  monitorId!: string

  @ApiProperty({ example: '2026-05-28T17:16:12.045Z', format: 'date-time' })
  checkedAt!: Date
}
