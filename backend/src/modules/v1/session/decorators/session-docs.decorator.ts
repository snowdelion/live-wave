import { applyDecorators, HttpCode, HttpStatus, type Type } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import type { ExtraResponse } from '@/backend/shared/decorators/docs.types'

export function SessionDocs({
  statusCode = HttpStatus.OK,
  summary,
  description,
  okDescription = 'Session success',
  unauthorizedDescription = 'No active session',
  badRequestDescription = 'Validation error',
  responseType,
  extraResponses = [],
}: SessionDocsArgs) {
  const decorators = [
    HttpCode(statusCode),
    ApiOperation({ summary, description }),
    ApiCookieAuth('clientId'),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: badRequestDescription }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: unauthorizedDescription }),
  ]

  if (statusCode === HttpStatus.NO_CONTENT)
    decorators.push(
      ApiResponse({ status: statusCode, description: `${okDescription} (No content)` }),
    )
  else {
    const responseOptions: Parameters<typeof ApiResponse>[0] = {
      status: statusCode,
      description: okDescription,
    }

    if (responseType) responseOptions.type = responseType
    decorators.push(ApiResponse(responseOptions))
  }

  for (const res of extraResponses) {
    const options: Parameters<typeof ApiResponse>[0] = {
      status: res.status,
      description: res.description,
    }
    if (res.example) {
      options.content = { 'application/json': { example: res.example } }
    }
    if (res.type) {
      if (Array.isArray(res.type)) {
        options.isArray = true
        options.type = res.type[0]
      } else options.type = res.type
    }
    decorators.push(ApiResponse(options))
  }

  return applyDecorators(...decorators)
}

interface SessionDocsArgs {
  summary: string
  description: string

  statusCode?: HttpStatus
  okDescription?: string
  unauthorizedDescription?: string
  badRequestDescription?: string

  responseType?: Type<unknown>
  extraResponses?: Array<ExtraResponse>
}
