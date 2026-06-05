import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Method, StatusEnum } from '@prisma/client'

export class MonitorCheckResponseDto {
  @ApiProperty({ example: 'ck3kq1t7x0000u1w6p8x1f1c2' })
  id!: string

  @ApiProperty({ example: 'up', enum: StatusEnum })
  status!: StatusEnum

  @ApiProperty({ example: 200, nullable: true })
  statusCode!: number | null

  @ApiProperty({ example: 1000, nullable: true })
  responseTime!: number | null

  @ApiProperty({ example: null, nullable: true })
  error!: string | null

  @ApiPropertyOptional({
    oneOf: [
      { $ref: '#/components/schemas/HttpCheckDetails' },
      { $ref: '#/components/schemas/TcpCheckDetails' },
      { $ref: '#/components/schemas/IcmpCheckDetails' },
    ],
    description: 'Check details depending on monitor type',
  })
  details?: HttpCheckDetails | TcpCheckDetails | IcmpCheckDetails

  @ApiProperty({ example: 'cmpplwrap0000u1cwddpe8mq8' })
  monitorId!: string

  @ApiProperty({ example: '2026-05-28T17:16:12.045Z', format: 'date-time' })
  checkedAt!: Date
}

export class HttpCheckDetails {
  @ApiProperty({ example: 'https://example.com' })
  url!: string

  @ApiProperty({ example: Method.HEAD })
  method!: Method
}

export class IcmpCheckDetails {
  @ApiProperty({ example: '0.0.0.0' })
  host!: string
}

export class TcpCheckDetails {
  @ApiProperty({ example: '0.0.0.0' })
  host!: string

  @ApiProperty({ example: 5432 })
  port!: number
}
