import type { ZodType } from 'zod'

import type { ErrorCode } from '../../config/error-codes'

export type RequestProps<T> = {
  url: string
  schema: ZodType<T>
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  timeout?: number
  errorCode?: ErrorCode
  signal?: AbortSignal | undefined
  body?: BodyInit | undefined
  json?: unknown
  fetchInit?: RequestInit
  isProtected?: boolean
  retries?: number
}

export type ExecuteOptions<T> = Omit<RequestProps<T>, 'timeout' | 'errorCode'> & {
  combinedSignal: AbortSignal
  method: NonNullable<RequestProps<T>['method']>
  isProtected: NonNullable<RequestProps<T>['isProtected']>
  retries: NonNullable<RequestProps<T>['retries']>
}
