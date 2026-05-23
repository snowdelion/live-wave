import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

export class ExtendSessionDto {
  @ApiProperty({ example: true, description: 'Whether the session was extended' })
  @IsBoolean()
  extended!: boolean
}
