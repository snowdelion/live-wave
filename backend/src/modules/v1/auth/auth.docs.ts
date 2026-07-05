import { HttpStatus } from '@nestjs/common'

import { SignInEmailDto } from './dto/requests/sign-in.dto'
import { SignUpEmailDto } from './dto/requests/sign-up.dto'
import { AccessTokenResponseDto } from './dto/responses/access-token-response.dto'

const FORBIDDEN_EXAMPLE = {
  example: {
    message: 'Access denied',
    error: 'Forbidden',
    statusCode: HttpStatus.FORBIDDEN,
  },
  status: HttpStatus.FORBIDDEN,
}

export const signUpEmailDocs = {
  summary: 'Registers a new account via Email',
  description:
    'Creates a new user account with email and password. Returns access token in response and sets refresh token as httpOnly cookie',
  extraResponses: [
    {
      type: AccessTokenResponseDto,
      status: HttpStatus.CREATED,
    },
    FORBIDDEN_EXAMPLE,
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
    FORBIDDEN_EXAMPLE,
  ],
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

export const logOutDocs = {
  summary: 'Logs out (clear tokens)',
  description: 'Invalidates the refresh token in Redis and clears the refresh token cookie',
  extraResponses: [{ status: HttpStatus.NO_CONTENT }],
  isProtected: true,
}

export const deleteDocs = {
  summary: 'Completely deletes account',
  description: 'Permanently deletes the user account and all associated data',
  extraResponses: [{ status: HttpStatus.NO_CONTENT }],
  isProtected: true,
}
