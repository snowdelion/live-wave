import { API_URL, AppError } from '@/shared/api'

import { AuthViaTelegramRequestSchema } from '../dto/auth-via-telegram.dto'
import { signInViaTelegram } from '../sign-in-via-telegram'

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}))

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: requestMock,
    useAuthStore: {
      getState: vi.fn(() => ({
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
      })),
    },
  }
})

describe('signInViaTelegram', () => {
  beforeEach(() => vi.clearAllMocks())

  const validBody = {
    id: 123456789,
    first_name: 'John',
    username: 'johndoe',
    auth_date: 1700000000,
    hash: 'abc123hash',
  }

  it('should validate the body and call request with the correct arguments', async () => {
    requestMock.mockResolvedValueOnce({
      data: { accessToken: 'token-abc' },
      status: 200,
    })

    const result = await signInViaTelegram(validBody as never)

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.AUTH.SIGN_IN_TELEGRAM,
        method: 'POST',
        json: validBody,
      }),
    )
    expect(result).toEqual({
      accessToken: 'token-abc',
    })
  })

  it('should pass the parsed/validated body as json, not the raw input reference', async () => {
    const parseSpy = vi.spyOn(AuthViaTelegramRequestSchema, 'parse')

    requestMock.mockResolvedValueOnce({
      data: { accessToken: 'token-abc' },
      status: 200,
    })

    await signInViaTelegram(validBody as never)

    expect(parseSpy).toHaveBeenCalledWith(validBody)
    expect(parseSpy).toHaveBeenCalledTimes(1)
  })

  it('should throw when the body fails schema validation', async () => {
    const invalidBody = { id: 'not-a-number' }

    await expect(signInViaTelegram(invalidBody as never)).rejects.toThrow()
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('should propagate errors thrown by request', async () => {
    requestMock.mockRejectedValueOnce(
      new AppError('SIGN_IN_TELEGRAM' as never, 'Telegram auth failed'),
    )

    await expect(signInViaTelegram(validBody as never)).rejects.toBeInstanceOf(AppError)
  })

  it('should return the exact data and status shape from request', async () => {
    const response = { data: { accessToken: 'xyz' }, status: 201 }
    requestMock.mockResolvedValueOnce(response)

    const result = await signInViaTelegram(validBody as never)

    expect(result).toBe(response.data)
  })
})
