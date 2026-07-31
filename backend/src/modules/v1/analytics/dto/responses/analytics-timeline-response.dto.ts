import { ApiProperty } from '@nestjs/swagger'

export class AnalyticsTimelineEntryDto {
  @ApiProperty({ example: '2026-06-12T16:00:00.000Z' })
  date!: string

  @ApiProperty({ example: 20, minimum: 0 })
  up!: number
  @ApiProperty({ example: 2, minimum: 0 })
  down!: number
  @ApiProperty({ example: 85.7, minimum: 0, maximum: 100 })
  uptime!: number

  @ApiProperty({ example: 29.5, nullable: true })
  averageResponseTime!: number | null
  @ApiProperty({ example: 42.5, nullable: true })
  p95ResponseTime!: number | null
}
