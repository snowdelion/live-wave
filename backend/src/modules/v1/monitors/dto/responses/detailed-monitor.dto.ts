import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, StatusEnum } from '@prisma/client'

import { HttpMonitorConfig } from './create-or-update/http-monitor-response.dto'

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

  @ApiProperty({
    type: HttpMonitorConfig,
    description: 'Current monitor type config options (url, method)',
  })
  httpMonitor!: HttpMonitorConfig

  @ApiProperty({
    example: 'example.com:80',
    description: 'Current monitor domain',
  })
  domain!: string

  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  lastCheckedAt!: Date
}
