import { ApiProperty } from '@nestjs/swagger'
import { Method, MonitorType } from '@prisma/client'

export class HttpMonitorConfig {
  @ApiProperty({ example: 'cmq13xw1d0000u1r46c0nvbzd' })
  monitorId!: string

  @ApiProperty({ example: 'https://example.com' })
  url!: string

  @ApiProperty({ enum: Method, example: 'HEAD' })
  method!: Method
}

export class CreateHttpMonitorResponse {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: HttpMonitorConfig,
    description: 'Current monitor type config options (url, method)',
  })
  httpMonitor!: HttpMonitorConfig
}

export class UpdateHttpMonitorResponse {
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: HttpMonitorConfig,
    description: 'Current monitor type config options (url, method)',
  })
  dnsMonitor!: HttpMonitorConfig
}
