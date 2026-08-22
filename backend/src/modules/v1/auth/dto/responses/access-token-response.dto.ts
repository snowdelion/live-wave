import { ApiProperty } from '@nestjs/swagger'

export class AccessTokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9IrEmdiZBAbB62o',
  })
  accessToken!: string
}

export class TokensResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9IrEmdiZBAbB62o',
  })
  accessToken!: string
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9IrEmdiZBAbB62o',
  })
  refreshToken!: string
}
