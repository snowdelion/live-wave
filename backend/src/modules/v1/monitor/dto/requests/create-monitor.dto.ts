import { ApiProperty } from '@nestjs/swagger'
import { Method } from '@prisma/client'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class CreateMonitorDto {
  @ApiProperty({ example: 'example', description: 'Name your monitor service' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @ApiProperty({
    example: 'https://example.com',
    description: 'Will make small monitoring requests',
  })
  @IsString()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Enter the correct URL address' })
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
