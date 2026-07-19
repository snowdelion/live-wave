import { applyDecorators, HttpStatus, type Type } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, type ApiParamOptions, ApiResponse } from '@nestjs/swagger'

import type { ExtraResponse } from '@/shared/decorators/docs.types'

export function TelegramDocs({
  summary,
  description,
  extraResponses = [],
  extraParam,
  bodyType,
}: TelegramDocsArgs) {
  const decorators = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'No active session',
    }),
  ]

  if (bodyType) decorators.push(ApiBody({ type: bodyType }))

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

  if (extraParam) decorators.push(ApiParam(extraParam))

  return applyDecorators(...decorators)
}

interface TelegramDocsArgs {
  summary: string
  description: string
  extraResponses?: ExtraResponse[]
  extraParam?: ApiParamOptions
  bodyType?: Type<unknown>
}
