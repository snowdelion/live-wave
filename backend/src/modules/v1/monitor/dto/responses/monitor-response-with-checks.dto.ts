import { ApiProperty } from '@nestjs/swagger'

import { HttpMonitorResponseDto } from './http-monitor-response.dto'
import { MonitorCheckResponseDto } from './monitor-check-response.dto'

export class MonitorResponseWithChecksDto extends HttpMonitorResponseDto {
  @ApiProperty({
    type: [MonitorCheckResponseDto],
    required: true,
  })
  checks!: MonitorCheckResponseDto[]
}
