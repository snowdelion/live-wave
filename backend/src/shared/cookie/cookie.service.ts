import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'

@Injectable()
export class CookieService {
  private readonly isProduction: boolean
  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production'
  }

  setRefreshToken(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }

  clearRefreshToken(res: Response) {
    res.clearCookie('refreshToken', { path: '/' })
  }
}
