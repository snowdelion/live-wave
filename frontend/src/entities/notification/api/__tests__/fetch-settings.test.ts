import { API_URL, request } from '@/shared/api'
import { ERROR_CODES } from '@/shared/api/config/error-codes'

import { fetchSettings, settingsSchema } from '../fetch-settings'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

const mockedRequest = vi.mocked(request) as any

describe('fetchSettings', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('calls request with the correct url, schema, and error code', async () => {
    const fakeData = { enabled: true, hasChat: true }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    await fetchSettings()

    expect(mockedRequest).toHaveBeenCalledTimes(1)
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.NOTIFICATION.SETTINGS,
        schema: settingsSchema,
        errorCode: ERROR_CODES.GET_SETTINGS,
        isProtected: true,
      }),
    )
  })

  it('returns the data field from the response', async () => {
    const fakeData = { enabled: true, hasChat: true }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    const result = await fetchSettings()

    expect(result).toEqual(fakeData)
  })

  it('propagates rejection if request throws', async () => {
    const error = new Error('Network error')
    mockedRequest.mockRejectedValueOnce(error)

    await expect(fetchSettings).rejects.toThrow('Network error')
  })

  it('propagates a schema validation error from request', async () => {
    const validationError = new Error('Invalid response shape')
    mockedRequest.mockRejectedValueOnce(validationError)

    await expect(fetchSettings()).rejects.toThrow('Invalid response shape')
  })
})
