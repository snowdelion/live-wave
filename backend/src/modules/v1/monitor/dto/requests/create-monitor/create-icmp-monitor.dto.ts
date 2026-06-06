import { ApiProperty } from '@nestjs/swagger'
import { MonitorType } from '@prisma/client'
import { IsString, MaxLength, MinLength } from 'class-validator'

import { CreateBaseMonitorDto } from './create-base-monitor.dto'

export class CreateIcmpMonitorDto extends CreateBaseMonitorDto {
  @ApiProperty({
    enum: MonitorType,
    example: MonitorType.ICMP,
    description: "Monitoring type (for this DTO it's always ICMP)",
  })
  type = MonitorType.ICMP

  @ApiProperty({
    example: '127.0.0.1',
    description: 'IP address or domain name of the host for ICMP ping (microservice, server)',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  host!: string
}
