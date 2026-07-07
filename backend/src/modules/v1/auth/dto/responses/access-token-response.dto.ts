import { ApiProperty } from '@nestjs/swagger'

export class AccessTokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9IrEmdiZBAbB62o',
  })
  accessToken!: string
}
