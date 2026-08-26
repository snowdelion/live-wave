import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, RecordType } from '@prisma/client'

export class DnsMonitorConfig {
  @ApiProperty({ example: 'cmq13xw1d0000u1r46c0nvbzd' })
  monitorId!: string

  @ApiProperty({ example: 'example.com' })
  host!: string
  @ApiProperty({ enum: RecordType, example: 'AAAA' })
  recordType!: RecordType
}
export class CreateDnsMonitorResponse {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: DnsMonitorConfig,
    description: 'Current monitor type config options (host, recordType)',
  })
  dnsMonitor!: DnsMonitorConfig
}

export class UpdateDnsMonitorResponse {
  @ApiProperty({ enum: MonitorType })
  type!: MonitorType

  @ApiProperty({
    type: DnsMonitorConfig,
    description: 'Current monitor type config options (host, recordType)',
  })
  dnsMonitor!: DnsMonitorConfig
}
