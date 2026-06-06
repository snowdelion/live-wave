import { ApiProperty } from '@nestjs/swagger'
import { Method, MonitorType } from '@prisma/client'
import { IsEnum, IsOptional, IsUrl, MaxLength } from 'class-validator'

import { CreateBaseMonitorDto } from './create-base-monitor.dto'

export class CreateHttpMonitorDto extends CreateBaseMonitorDto {
  type = MonitorType.HTTP

  @ApiProperty({
    example: 'https://example.com',
    description: 'Will make small monitoring HTTP requests',
  })
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL' })
  @MaxLength(1000)
  url!: string

  @ApiProperty({
    enum: Method,
    default: Method.HEAD,
    example: 'HEAD',
    description: 'Request method type. "HEAD" by default',
    required: false,
  })
  @IsEnum(Method)
  @IsOptional()
  method?: Method = Method.HEAD
}
