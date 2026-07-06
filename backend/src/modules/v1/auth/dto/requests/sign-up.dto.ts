import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class SignUpEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @ApiProperty({ example: '12345678', minLength: 8, maxLength: 16 })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @IsNotEmpty()
  password!: string
}

export class SignUpTelegramDto {
  @Transform(() => String)
  @MinLength(8)
  @IsNotEmpty()
  telegramId!: string
}
