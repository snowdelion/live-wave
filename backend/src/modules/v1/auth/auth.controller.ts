import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiExtraModels } from '@nestjs/swagger'
import { seconds, Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'

import { CookieService } from '@/backend/shared/cookie/cookie.service'
import { Cookies } from '@/backend/shared/cookie/cookies.decorator'

import {
  deleteDocs,
  logOutDocs,
  refreshTokenDocs,
  signInEmailDocs,
  signUpEmailDocs,
  telegramDocs,
} from './auth.docs'
import { AuthService } from './auth.service'
import { AuthDocs } from './decorators/auth-docs.decorator'
import { SignInEmailDto } from './dto/requests/sign-in.dto'
import { SignUpEmailDto } from './dto/requests/sign-up.dto'
import { TelegramAuthDto } from './dto/requests/telegram-auth.dto'

@ApiExtraModels(SignInEmailDto, TelegramAuthDto, SignUpEmailDto)
@Controller('v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
  ) {}

  @Post('sign-up/email')
  @AuthDocs(signUpEmailDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 5 }, long: { ttl: seconds(3600), limit: 20 } })
  @HttpCode(HttpStatus.CREATED)
  async signUpEmail(@Body() dto: SignUpEmailDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signUpEmail(dto)

    this.cookieService.setRefreshToken(res, refreshToken)
    return { accessToken }
  }

  @Post('sign-in/email')
  @AuthDocs(signInEmailDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 5 }, long: { ttl: seconds(3600), limit: 20 } })
  async signInEmail(@Body() dto: SignInEmailDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signInEmail(dto)

    this.cookieService.setRefreshToken(res, refreshToken)
    return { accessToken }
  }

  @Post('telegram')
  @AuthDocs(telegramDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 5 }, long: { ttl: seconds(3600), limit: 20 } })
  async telegramAuth(@Body() dto: TelegramAuthDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.telegramAuth(dto)

    this.cookieService.setRefreshToken(res, refreshToken)
    return { accessToken }
  }

  @Post('refresh-token')
  @AuthDocs(refreshTokenDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  async refreshToken(@Cookies('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token not found')

    const { accessToken } = await this.authService.refreshAccessToken(refreshToken)
    return { accessToken }
  }

  @Post('log-out')
  @AuthDocs(logOutDocs)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logOut(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (refreshToken) await this.authService.invalidateRefreshToken(refreshToken)
    this.cookieService.clearRefreshToken(res)
  }

  @Delete('me')
  @AuthDocs(deleteDocs)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: Request) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('User not found')
    await this.authService.delete(userId)
  }
}
