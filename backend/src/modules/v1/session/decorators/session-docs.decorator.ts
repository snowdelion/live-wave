import { applyDecorators, HttpCode, HttpStatus, type Type } from '@nestjs/common'
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

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

  for (const res of extraResponses) decorators.push(ApiResponse(res))

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

type ExtraResponse = {
  status: HttpStatus
  description: string

  type?: Type<unknown>
}
