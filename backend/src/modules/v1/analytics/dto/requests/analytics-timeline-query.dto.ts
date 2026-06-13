import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class AnalyticsTimelineQueryDto {
  @ApiProperty({
    required: false,
    default: 7,
    minimum: 1,
    maximum: 30,
    example: 14,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number = 7
}
