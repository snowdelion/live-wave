import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNumber } from 'class-validator'

export class CurrentSessionDto {
  @IsBoolean()
  @ApiProperty({ example: true, description: 'whether session exists' })
  exists!: boolean

  @IsNumber()
  @ApiProperty({ example: 5, description: 'number of services being monitored' })
  servicesCount!: number

  @IsBoolean()
  @ApiProperty({ example: false, description: 'telegram linked to this session' })
  telegramLinked!: boolean
}
