import { AppError } from '@/shared/api'

import { refreshToken } from '../refresh-token'

const { requestMock, setAccessTokenMock } = vi.hoisted(() => {
  const setAccessTokenMock = vi.fn()
  return {
    requestMock: vi.fn(),
    setAccessTokenMock,
  }
})

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: requestMock,
    useAuthStore: {
      getState: vi.fn(() => ({
        setAccessToken: setAccessTokenMock,
        clearAccessToken: vi.fn(),
      })),
    },
  }
})

describe('refreshToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should call request with the correct arguments', async () => {
    requestMock.mockResolvedValueOnce({
      data: { accessToken: 'new-token' },
      status: 200,
    })

    await refreshToken()

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/auth/refresh-token',
        method: 'POST',
      }),
    )
  })

  it('should return the exact data and status shape from request', async () => {
    const response = { data: { accessToken: 'xyz' }, status: 201 }
    requestMock.mockResolvedValueOnce(response)

    const result = await refreshToken()

    expect(result).toBe(response.data)
  })

  it('should propagate errors thrown by request and not call setAccessToken', async () => {
    requestMock.mockRejectedValueOnce(new AppError('REFRESH_TOKEN' as never, 'Refresh failed'))

    await expect(refreshToken()).rejects.toBeInstanceOf(AppError)
    expect(setAccessTokenMock).not.toHaveBeenCalled()
  })
})
