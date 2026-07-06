import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, StatusEnum } from '@prisma/client'

class TrendConfig {
  @ApiProperty({ example: 42, nullable: true })
  avgResponseTime!: number | null
  @ApiProperty({ example: 30, nullable: true })
  minResponseTime!: number | null
  @ApiProperty({ example: 50, nullable: true })
  maxResponseTime!: number | null
  @ApiProperty({ example: [30, 50, 40] })
  sparkline!: number[]
}

export class MonitorByUserResponseDto {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ example: 'example' })
  name!: string

  @ApiProperty({
    example: 'https://example.com',
    examples: ['https://example.com', 'example.com:80', 'www.example.com'],
  })
  domain!: string

  @ApiProperty({ example: MonitorType.HTTP, enum: MonitorType })
  type!: MonitorType
  @ApiProperty({ enum: StatusEnum, nullable: true, example: null })
  lastStatus!: StatusEnum | null

  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  lastCheckedAt!: Date

  @ApiProperty({ type: TrendConfig })
  trend!: TrendConfig
  @ApiProperty({ example: 99.45, minimum: 0, maximum: 100, nullable: true })
  weekUptime!: number | null
}
