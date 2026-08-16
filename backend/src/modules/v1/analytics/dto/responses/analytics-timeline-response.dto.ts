import { ApiProperty } from '@nestjs/swagger'

export class AnalyticsTimelineItemDto {
  @ApiProperty({ example: '2026-06-12T16:00:00.000Z' })
  date!: string
  @ApiProperty({ example: 85.7, minimum: 0, maximum: 100 })
  uptime!: number
  @ApiProperty({ example: 29.5, nullable: true })
  averageResponseTime!: number | null
  @ApiProperty({ example: 42.5, nullable: true })
  p95ResponseTime!: number | null
}

export class AnalyticsTimelineDto {
  @ApiProperty({ type: AnalyticsTimelineItemDto, isArray: true })
  items!: AnalyticsTimelineItemDto[]
  @ApiProperty({ example: false })
  shouldShowP95!: boolean
}
