import { ApiProperty } from '@nestjs/swagger'

export class AnalyticsTimelineEntryDto {
  @ApiProperty({ example: '2026-06-12T16:00:00.000Z' })
  timestamp!: string

  @ApiProperty({ example: 20 })
  up!: number
  @ApiProperty({ example: 2 })
  down!: number

  @ApiProperty({ example: 29.5 })
  averageResponseTime!: number
}
