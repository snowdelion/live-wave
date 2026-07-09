import { API_URL, AppError } from '@/shared/api'

import { logout } from '../log-out'

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}))

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: requestMock,
    useAuthStore: {
      getState: vi.fn(() => ({ clearAccessToken: vi.fn() })),
    },
  }
})

describe('logout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should call request with the correct arguments', async () => {
    requestMock.mockResolvedValueOnce({
      data: null,
      status: 200,
    })

    await logout()

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.AUTH.LOGOUT,
        method: 'POST',
        isProtected: true,
      }),
    )
  })

  it('should return the exact data and status shape from request', async () => {
    const response = { data: null, status: 204 }
    requestMock.mockResolvedValueOnce(response)

    const result = await logout()

    expect(result).toEqual({ success: true })
  })

  it('should propagate errors thrown by request', async () => {
    requestMock.mockRejectedValueOnce(new AppError('LOGOUT' as never, 'Logout failed'))

    await expect(logout()).rejects.toBeInstanceOf(AppError)
  })
})
