import { ApiProperty } from '@nestjs/swagger'
import { MonitorType } from '@prisma/client'

export class TcpMonitorConfig {
  @ApiProperty({ example: 'cmq13xw1d0000u1r46c0nvbzd' })
  monitorId!: string

  @ApiProperty({ example: '0.0.0.0' })
  host!: string
  @ApiProperty({ example: 5432 })
  port!: number
}

export class CreateTcpMonitorResponse {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: TcpMonitorConfig,
    description: 'Current monitor type config options (host, port)',
  })
  tcpMonitor!: TcpMonitorConfig
}

export class UpdateTcpMonitorResponse {
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: TcpMonitorConfig,
    description: 'Current monitor type config options (host, port)',
  })
  dnsMonitor!: TcpMonitorConfig
}
