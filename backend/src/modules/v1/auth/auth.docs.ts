import { HttpStatus } from '@nestjs/common'

import { SignInEmailDto } from './dto/requests/sign-in.dto'
import { SignUpEmailDto } from './dto/requests/sign-up.dto'
import { TelegramAuthDto } from './dto/requests/telegram-auth.dto'
import {
  AccessTokenResponseDto,
  TokensResponseDto,
} from './dto/responses/access-token-response.dto'

export const signUpEmailDocs = {
  summary: 'Registers a new account via Email',
  description:
    'Creates a new user account with email and password. Returns access token in response and sets refresh token as httpOnly cookie',
  extraResponses: [
    {
      type: AccessTokenResponseDto,
      status: HttpStatus.CREATED,
    },
    {
      example: {
        message: 'Email already taken',
        error: 'Conflict',
        statusCode: HttpStatus.CONFLICT,
      },
      status: HttpStatus.CONFLICT,
    },
  ],
  hasBadRequest: true,
  bodyType: SignUpEmailDto,
}

export const signInEmailDocs = {
  summary: 'Sign in an existing account via Email',
  description:
    'Authenticates a user using email and password. Returns access token in response and sets refresh token as httpOnly cookie',
  extraResponses: [
    {
      type: AccessTokenResponseDto,
      status: HttpStatus.OK,
    },
  ],
  isProtected: true,
  hasBadRequest: true,
  bodyType: SignInEmailDto,
}

export const refreshTokenDocs = {
  summary: 'Refreshes access token',
  description: 'Uses the refresh token from httpOnly cookie to generate a new access token',
  extraResponses: [
    {
      type: AccessTokenResponseDto,
      status: HttpStatus.OK,
    },
  ],
  isProtected: true,
}

export const telegramDocs = {
  summary: 'Sign in an existing account via Telegram',
  description:
    'Authenticates a user using Telegram OAuth. Returns access token in response and sets refresh token as httpOnly cookie',
  extraResponses: [
    {
      type: TokensResponseDto,
      status: HttpStatus.OK,
    },
  ],
  hasBadRequest: true,
  isProtected: true,
  bodyType: TelegramAuthDto,
}

export const logOutDocs = {
  summary: 'Logs out (clear tokens)',
  description: 'Invalidates the refresh token in Redis and clears the refresh token cookie',
  extraResponses: [{ status: HttpStatus.NO_CONTENT }],
  isProtected: true,
}
