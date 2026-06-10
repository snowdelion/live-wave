import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, RecordType, StatusEnum } from '@prisma/client'

export class DnsMonitorConfig {
  @ApiProperty({ example: 'cmq13xw1d0000u1r46c0nvbzd' })
  monitorId!: string

  @ApiProperty({ example: 'example.com' })
  host!: string

  @ApiProperty({ enum: RecordType, example: 'AAAA' })
  recordType!: RecordType
}
export class DnsMonitorResponseDto {
  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  id!: string
  @ApiProperty({ example: 'example' })
  name!: string
  @ApiProperty({ example: MonitorType.DNS, enum: MonitorType })
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
    type: DnsMonitorConfig,
    description: 'Current monitor type config options (host, recordType)',
  })
  dnsMonitor!: DnsMonitorConfig

  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  lastCheckedAt!: Date
  @ApiProperty({ example: '2026-05-28T17:17:12.045Z' })
  nextCheckAt!: Date
  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  createdAt!: Date
  @ApiProperty({ example: '2026-05-28T17:16:12.045Z' })
  updatedAt!: Date
}
