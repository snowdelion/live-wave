import { ApiProperty } from '@nestjs/swagger'

class DailyStatDto {
  @ApiProperty({ example: '2026-06-01' })
  day!: string
  @ApiProperty({ example: 99.5 })
  uptime!: number | null
  @ApiProperty({ example: 124.5 })
  averageResponseTime!: number | null
  @ApiProperty({ example: 2 })
  failureCount!: number
}

export class AnalyticsOverviewResponseDto {
  @ApiProperty({ example: 'cmq1d5x1d0000u1qkxahiwepg' })
  monitorId!: string
  @ApiProperty({ example: 'Example HTTP' })
  monitorName!: string

  @ApiProperty({ example: 30 })
  periodDays!: number

  @ApiProperty({ example: '2026-06-01T13:00:00Z' })
  startDate!: Date
  @ApiProperty({ example: '2026-06-01T13:05:00Z' })
  endDate!: Date

  @ApiProperty({ example: 1000 })
  totalChecks!: number
  @ApiProperty({ example: 99.5 })
  uptime!: number | null
  @ApiProperty({ example: 124.5 })
  averageResponseTime!: number | null

  @ApiProperty({ type: [DailyStatDto] })
  dailyStats?: DailyStatDto[]
}
