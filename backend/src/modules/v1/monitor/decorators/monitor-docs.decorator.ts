import { applyDecorators, HttpStatus, type Type } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, type ApiParamOptions, ApiResponse } from '@nestjs/swagger'

import type { ExtraResponse } from '@/backend/shared/decorators/docs.types'

export function MonitorDocs({
  summary,
  description,
  unauthorizedDescription = 'No active session',
  extraResponses = [],
  extraParam,
  responseType,
  bodySchema,
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
    if (bodySchema) decorators.push(ApiBody({ schema: bodySchema }))
    else if (isUpdate)
      decorators.push(
        ApiBody({
          schema: {
            oneOf: [
              { $ref: '#/components/schemas/UpdateHttpMonitorDto' },
              { $ref: '#/components/schemas/UpdateTcpMonitorDto' },
              { $ref: '#/components/schemas/UpdateIcmpMonitorDto' },
            ],
            discriminator: { propertyName: 'type' },
          },
        }),
      )
    else
      decorators.push(
        ApiBody({
          schema: {
            oneOf: [
              { $ref: '#/components/schemas/CreateHttpMonitorDto' },
              { $ref: '#/components/schemas/CreateTcpMonitorDto' },
              { $ref: '#/components/schemas/CreateIcmpMonitorDto' },
            ],
            discriminator: { propertyName: 'type' },
          },
        }),
      )
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
  bodySchema?: {
    oneOf: Array<{ $ref: string }>
    discriminator: { propertyName: string }
  }
  isUpdate?: boolean
  hasBody?: boolean
}
