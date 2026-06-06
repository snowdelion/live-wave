import { ApiProperty } from '@nestjs/swagger'
import { MonitorType } from '@prisma/client'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export abstract class CreateBaseMonitorDto {
  @ApiProperty({ example: 'example', description: 'Name your monitor service' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @ApiProperty({
    example: MonitorType.HTTP,
    description: 'The type of monitoring',
  })
  @IsEnum(MonitorType)
  type!: MonitorType

  @ApiProperty({
    example: 10,
    default: 10,
    description: 'Check interval in minutes. 10m interval by default. Min: 5, Max: 60',
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  checkInterval?: number = 10

  @ApiProperty({
    example: 5000,
    default: 5000,
    description: 'Timeout in milliseconds',
    required: false,
  })
  @IsInt()
  @Min(5000)
  @Max(30000)
  @IsOptional()
  timeout?: number = 5000
}
