import { applyDecorators, HttpStatus, type Type } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'

import type { ExtraResponse } from '@/backend/shared/decorators/docs.types'

export function UsersDocs({
  summary,
  description,
  extraResponses = [],
  bodyType,
  isProtected = false,
  hasBadRequest = false,
}: UsersDocsArgs) {
  const decorators = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      example: {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
      },
    }),
  ]

  for (const res of extraResponses) {
    const options: Parameters<typeof ApiResponse>[0] = {
      status: res.status,
      description: res.description,
    }

    if (res.example) options.content = { 'application/json': { example: res.example } }

    if (res.type) {
      if (Array.isArray(res.type)) {
        options.isArray = true
        options.type = res.type[0]
      } else options.type = res.type
    }

    decorators.push(ApiResponse(options))
  }

  if (bodyType) ApiBody({ type: bodyType })

  if (hasBadRequest)
    decorators.push(
      ApiResponse({
        example: {
          message: 'Expected double-quoted property name in JSON',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        status: HttpStatus.BAD_REQUEST,
      }),
    )

  if (isProtected)
    decorators.push(
      ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        example: {
          message: 'Refresh token not found',
          error: 'Unauthorized',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
      }),
    )

  return applyDecorators(...decorators)
}

interface UsersDocsArgs {
  summary: string
  description: string
  extraResponses?: ExtraResponse[]
  bodyType?: Type<unknown>
  isProtected?: boolean
  hasBadRequest?: boolean
}
