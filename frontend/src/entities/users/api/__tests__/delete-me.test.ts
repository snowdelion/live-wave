import { API_URL, AppError, ERROR_CODES, request } from '@/shared/api'

import { deleteMe } from '../delete-me'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

const mockedRequest = vi.mocked(request)

describe('deleteMe', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('returns { success: true } when the server responds with 204', async () => {
    mockedRequest.mockResolvedValue({ status: 204, data: undefined })

    const result = await deleteMe()

    expect(result).toEqual({ success: true })
  })

  it('returns { success: true } when the server responds with 200', async () => {
    mockedRequest.mockResolvedValue({ status: 200, data: undefined })

    const result = await deleteMe()

    expect(result).toEqual({ success: true })
  })

  it('calls request with the correct url, method, and errorCode', async () => {
    mockedRequest.mockResolvedValue({ status: 204, data: undefined })

    await deleteMe()

    expect(mockedRequest).toHaveBeenCalledTimes(1)
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.USERS.DELETE,
        method: 'DELETE',
        errorCode: ERROR_CODES.DELETE_USER,
      }),
    )
  })

  it('throws an AppError with the DELETE_USER code and expected message on non-204 status', async () => {
    mockedRequest.mockResolvedValue({ status: 404, data: undefined })

    await expect(deleteMe()).rejects.toMatchObject({
      code: ERROR_CODES.DELETE_USER,
      message: 'Failed to delete user',
    })
  })

  it.each([201, 202, 404, 500])('throws for any non-204 status (%i)', async status => {
    mockedRequest.mockResolvedValue({ status, data: undefined })

    await expect(deleteMe()).rejects.toThrow(AppError)
  })

  it('propagates errors thrown by request itself (e.g. network failure)', async () => {
    const networkError = new AppError(ERROR_CODES.DELETE_MONITOR, 'Network error')
    mockedRequest.mockRejectedValue(networkError)

    await expect(deleteMe()).rejects.toBe(networkError)
  })
})
