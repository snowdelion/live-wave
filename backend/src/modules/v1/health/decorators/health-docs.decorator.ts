import { applyDecorators, HttpStatus } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

export function HealthDocs({
  summary,
  description,
  okExample,
  unavailableExample,
}: HealthDocsArgs) {
  const decorators = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OK',
      content: okExample ? { 'application/json': { example: okExample } } : undefined,
    }),
  ]

  if (unavailableExample)
    decorators.push(
      ApiResponse({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        description: 'Service Unavailable',
        content: unavailableExample
          ? { 'application/json': { example: unavailableExample } }
          : undefined,
      }),
    )

  return applyDecorators(...decorators)
}

interface HealthDocsArgs {
  summary: string
  description: string

  okExample?: Record<string, unknown>
  unavailableExample?: Record<string, unknown>
}
