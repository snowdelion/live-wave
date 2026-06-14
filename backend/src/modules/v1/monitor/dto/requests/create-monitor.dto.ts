import { ApiProperty } from '@nestjs/swagger'
import { MonitorType, Method, RecordType } from '@prisma/client'
import {
  ValidateIf,
  IsUrl,
  IsString,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator'

interface HasMonitorType {
  type: MonitorType
}

export class CreateMonitorDto {
  @ApiProperty({ example: 'example', description: 'Name your monitor service' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
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

  @ApiProperty({
    example: 'https://example.com',
    description: 'Will make small monitoring HTTP requests',
  })
  @MaxLength(1000)
  @ValidateIf((o: HasMonitorType) => o.type === MonitorType.HTTP)
  @IsUrl({ protocols: ['http', 'https'] })
  url?: string

  @ValidateIf((o: HasMonitorType) => o.type === MonitorType.HTTP)
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

  @ValidateIf(
    (o: HasMonitorType) =>
      o.type === MonitorType.ICMP || o.type === MonitorType.TCP || o.type === MonitorType.DNS,
  )
  @ApiProperty({
    example: 'localhost',
    description: 'The IP address or domain name of the target host to test the connection',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  host?: string

  @ValidateIf((o: HasMonitorType) => o.type === MonitorType.TCP)
  @ApiProperty({
    example: 8000,
    description: 'Network port for checking the availability of the TCP service',
    minimum: 1,
    maximum: 65535,
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number

  @ValidateIf((o: HasMonitorType) => o.type === MonitorType.DNS)
  @ApiProperty({
    enum: RecordType,
    default: RecordType.A,
    required: false,
    description: 'DNS record type (A, AAAA, MX, TXT, CNAME)',
  })
  @IsEnum(RecordType)
  @IsOptional()
  recordType?: RecordType = RecordType.A
}
