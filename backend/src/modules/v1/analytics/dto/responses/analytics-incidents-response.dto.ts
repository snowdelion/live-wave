import { ApiProperty } from '@nestjs/swagger'

export class IncidentDto {
  @ApiProperty({ example: 1 })
  id!: number

  @ApiProperty({ example: '2026-06-13T11:44:35.334Z' })
  startAt!: Date

  @ApiProperty({
    example: '2026-06-13T11:45:35.529Z',
    nullable: true,
  })
  endAt!: Date | null

  @ApiProperty({ example: 60195 })
  durationMs!: number

  @ApiProperty({
    example: 'getaddrinfo ENOTFOUND example.com',
    nullable: true,
  })
  cause!: string | null

  @ApiProperty({ enum: ['Resolved', 'Active'], example: 'Active' })
  status!: 'Resolved' | 'Active'

  @ApiProperty({ example: '2m 34s' })
  formattedDuration!: string
}

export class AnalyticsIncidentsResponseDto {
  @ApiProperty({
    type: [IncidentDto],
  })
  incidents!: IncidentDto[]

  @ApiProperty({ example: 1 })
  total!: number
}
