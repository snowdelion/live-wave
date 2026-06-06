import { ApiProperty } from '@nestjs/swagger'
import { MonitorType } from '@prisma/client'
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

import { CreateBaseMonitorDto } from './create-base-monitor.dto'

export class CreateTcpMonitorDto extends CreateBaseMonitorDto {
  @ApiProperty({
    enum: MonitorType,
    example: MonitorType.TCP,
    description: "Monitoring type (for this DTO it's always TCP)",
  })
  type = MonitorType.TCP

  @ApiProperty({
    example: 'localhost',
    description: 'The IP address or domain name of the target host to test the TCP connection',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  host!: string

  @ApiProperty({
    example: 8000,
    description: 'Network port for checking the availability of the TCP service',
    minimum: 1,
    maximum: 65535,
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number
}
