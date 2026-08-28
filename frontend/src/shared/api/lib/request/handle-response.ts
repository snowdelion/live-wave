import type { ZodType } from 'zod'

import { throwResponseErrors } from '../error-handler'

import { extractErrorMessage } from './handle-error'
import { ABORTED_STATUS, NO_CONTENT_STATUS } from './request.constants'

export async function handleResponse<T>({
  response,
  schema,
}: {
  response: Response
  schema: ZodType<T>
}): Promise<{ data: T; status: number }> {
  if (!response.ok) {
    if (response.status === ABORTED_STATUS) throw new DOMException('Aborted', 'AbortError')
    const errorMessage = await extractErrorMessage(response)
    throwResponseErrors(response.status, undefined, response.status, errorMessage)
  }
  if (response.status === NO_CONTENT_STATUS) return { data: null as T, status: response.status }

  const rawData: unknown = await response.json()
  const data = schema.parse(rawData)
  return { data, status: response.status }
}
