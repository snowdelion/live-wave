import { API_URL, request } from '@/shared/api'
import { ERROR_CODES } from '@/shared/api/config/error-codes'

import { currentUserSchema } from '../dto/current-user.dto'
import { fetchMe } from '../fetch-me'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

const mockedRequest = vi.mocked(request) as any

describe('fetchMe', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('calls request with the correct url, schema, and error code', async () => {
    const fakeData = { id: '123', email: 'a@b' }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    await fetchMe()

    expect(mockedRequest).toHaveBeenCalledTimes(1)
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.USERS.ME,
        schema: currentUserSchema,
        errorCode: ERROR_CODES.GET_USER,
      }),
    )
  })

  it('returns the data field from the response', async () => {
    const fakeData = { id: '123', email: 'a@b' }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    const result = await fetchMe()

    expect(result).toEqual(fakeData)
  })

  it('propagates rejection if request throws', async () => {
    const error = new Error('Network error')
    mockedRequest.mockRejectedValueOnce(error)

    await expect(fetchMe()).rejects.toThrow('Network error')
  })

  it('propagates a schema validation error from request', async () => {
    const validationError = new Error('Invalid response shape')
    mockedRequest.mockRejectedValueOnce(validationError)

    await expect(fetchMe()).rejects.toThrow('Invalid response shape')
  })
})
