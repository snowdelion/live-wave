import type { HttpStatus, Type } from '@nestjs/common'

export type ExtraResponse = {
  status: HttpStatus
  description?: string

  example?: unknown
  type?: Type<unknown> | Type<unknown>[]
}
