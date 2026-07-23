import { API_URL, request } from '@/shared/api'
import { ERROR_CODES } from '@/shared/api/config/error-codes'

import { toggleAlert, toggleAlertResponseSchema } from '../toggle-alert'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

const mockedRequest = vi.mocked(request) as any

describe('toggleAlert', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('calls request with the correct url, schema, and error code', async () => {
    const fakeData = { message: 'success' }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    await toggleAlert()

    expect(mockedRequest).toHaveBeenCalledTimes(1)
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.NOTIFICATION.TOGGLE_ALERT,
        method: 'PATCH',
        schema: toggleAlertResponseSchema,
        errorCode: ERROR_CODES.TOGGLE_ALERT,
        isProtected: true,
      }),
    )
  })

  it('returns the data field from the response', async () => {
    const fakeData = { message: 'success' }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    const result = await toggleAlert()

    expect(result).toEqual(fakeData)
  })

  it('propagates rejection if request throws', async () => {
    const error = new Error('Network error')
    mockedRequest.mockRejectedValueOnce(error)

    await expect(toggleAlert()).rejects.toThrow('Network error')
  })

  it('propagates a schema validation error from request', async () => {
    const validationError = new Error('Invalid response shape')
    mockedRequest.mockRejectedValueOnce(validationError)

    await expect(toggleAlert()).rejects.toThrow('Invalid response shape')
  })
})
