import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, StatusEnum } from '@prisma/client'

import { HttpMonitorConfig } from './create-or-update/http-monitor-response.dto'
import { MonitorCheckResponseDto } from './monitor-check-response.dto'

export class DetailedMonitorDto {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ example: 'example' })
  name!: string
  @ApiProperty({ example: MonitorType.HTTP, enum: MonitorType })
  type!: MonitorType

  @ApiProperty({ example: 10 })
  checkInterval!: number
  @ApiProperty({ example: 5000 })
  timeout!: number
  @ApiProperty({ enum: StatusEnum, nullable: true, example: null })
  lastStatus!: StatusEnum | null

  @ApiProperty({ example: 'b052a0fc-e3f0-4a7f-8d61-152f585aeea1' })
  clientId!: string

  @ApiProperty({
    type: HttpMonitorConfig,
    description: 'Current monitor type config options (url, method)',
  })
  httpMonitor!: HttpMonitorConfig

  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  lastCheckedAt!: Date
  @ApiProperty({ example: '2026-05-28T17:17:12.045Z' })
  nextCheckAt!: Date
  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  createdAt!: Date
  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  updatedAt!: Date

  @ApiProperty({
    type: [MonitorCheckResponseDto],
    required: true,
  })
  checks!: MonitorCheckResponseDto[]
}
