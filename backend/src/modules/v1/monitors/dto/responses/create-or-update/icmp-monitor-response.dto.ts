import { ApiProperty } from '@nestjs/swagger'
import { MonitorType } from '@prisma/client'

export class IcmpMonitorConfig {
  @ApiProperty({ example: 'cmq13xw1d0000u1r46c0nvbzd' })
  monitorId!: string

  @ApiProperty({ example: '0.0.0.0' })
  host!: string
}

export class CreateIcmpMonitorResponse {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: IcmpMonitorConfig,
    description: 'Current monitor type config options (host)',
  })
  icmpMonitor!: IcmpMonitorConfig
}

export class UpdateIcmpMonitorResponse {
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: IcmpMonitorConfig,
    description: 'Current monitor type config options (host)',
  })
  dnsMonitor!: IcmpMonitorConfig
}
