import { ApiProperty } from '@nestjs/swagger'

import { MonitorCheckResponseDto } from './monitor-check-response.dto'
import { MonitorResponseDto } from './monitor-response.dto'

export class MonitorResponseWithChecksDto extends MonitorResponseDto {
  @ApiProperty({
    type: [MonitorCheckResponseDto],
    required: true,
  })
  checks!: MonitorCheckResponseDto[]
}
