import { ApiProperty } from '@nestjs/swagger'

import { CheckResponseDto } from '../../checks/dto/check-response.dto'

import { MonitorResponseDto } from './monitor-response.dto'

export class MonitorResponseWithChecksDto extends MonitorResponseDto {
  @ApiProperty({
    type: [CheckResponseDto],
    required: true,
  })
  checks!: CheckResponseDto[]
}
