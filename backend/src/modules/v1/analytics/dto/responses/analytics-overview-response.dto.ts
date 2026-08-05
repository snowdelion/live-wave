import { ApiProperty } from '@nestjs/swagger'

export class AnalyticsOverviewResponseDto {
  @ApiProperty({ example: 1000 })
  totalChecks!: number
  @ApiProperty({ example: 99.5 })
  uptime!: number
  @ApiProperty({ example: 900 })
  up!: number
  @ApiProperty({ example: 100 })
  down!: number
  @ApiProperty({ example: 124.5, nullable: true })
  averageResponseTime!: number | null
}
