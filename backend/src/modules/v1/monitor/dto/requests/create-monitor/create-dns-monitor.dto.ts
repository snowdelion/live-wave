import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, RecordType } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

import { CreateBaseMonitorDto } from './create-base-monitor.dto'

export class CreateDnsMonitorDto extends CreateBaseMonitorDto {
  @ApiProperty({ enum: MonitorType, default: MonitorType.DNS, required: false })
  type = MonitorType.DNS

  @ApiProperty({
    description: 'Domain name to query (e.g., "example.com")',
    example: 'example.com',
  })
  @IsString()
  host!: string

  @ApiProperty({
    enum: RecordType,
    default: RecordType.A,
    required: false,
    description: 'DNS record type (A, AAAA, MX, TXT, CNAME)',
  })
  @IsEnum(RecordType)
  @IsOptional()
  recordType?: RecordType = RecordType.A
}
