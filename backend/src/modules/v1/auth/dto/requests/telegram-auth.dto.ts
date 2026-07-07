import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class TelegramAuthDto {
  @ApiProperty({ example: 123456789 })
  @IsNumber()
  @Min(1)
  id!: number

  @ApiProperty({ example: 'User first name' })
  @IsString()
  first_name!: string

  @ApiProperty({ example: 175647632 })
  @IsNumber()
  @Min(1)
  auth_date!: number

  @ApiProperty({ example: 'User last name', required: false })
  @IsString()
  @IsOptional()
  last_name?: string

  @ApiProperty({ example: 'user_username', required: false })
  @IsString()
  @IsOptional()
  username?: string

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsString()
  @IsOptional()
  photo_url?: string

  @ApiProperty({ example: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' })
  @IsString()
  hash!: string
}
