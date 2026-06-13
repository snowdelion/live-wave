import { applyDecorators, HttpStatus, type Type } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'

export function AnalyticsDocs({ summary, description, okResponseType }: AnalyticsDocsOptions) {
  const isArray = Array.isArray(okResponseType)
  const type = isArray ? okResponseType[0] : okResponseType

  const decorators = [
    ApiOperation({ summary, description }),
    ApiParam({
      name: 'monitorId',
      description: 'Monitoring service ID',
      example: 'cmpplwrap0000u1cwddpe8mq8',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'No active session',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Monitor not found',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Success',
      type,
      isArray,
    }),
  ]

  return applyDecorators(...decorators)
}

interface AnalyticsDocsOptions {
  summary: string
  description: string

  okResponseType?: Type<unknown> | Type<unknown>[]
}
