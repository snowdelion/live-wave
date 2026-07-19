import { applyDecorators, HttpStatus, type Type } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, type ApiParamOptions, ApiResponse } from '@nestjs/swagger'

import type { ExtraResponse } from '@/shared/decorators/docs.types'

import { CreateMonitorDto } from '../dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from '../dto/requests/update-monitor.dto'

export function MonitorDocs({
  summary,
  description,
  unauthorizedDescription = 'No active session',
  extraResponses = [],
  extraParam,
  responseType,
  isUpdate = false,
  hasBody = true,
}: MonitorDocsArgs) {
  const decorators = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: unauthorizedDescription,
      type: responseType,
    }),
  ]

  if (hasBody) {
    const bodyType = isUpdate ? UpdateMonitorDto : CreateMonitorDto
    decorators.push(ApiBody({ type: bodyType }))
  }

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

interface MonitorDocsArgs {
  summary: string
  description: string
  unauthorizedDescription?: string
  extraResponses?: ExtraResponse[]
  extraParam?: ApiParamOptions
  responseType?: Type<unknown>
  isUpdate?: boolean
  hasBody?: boolean
}
