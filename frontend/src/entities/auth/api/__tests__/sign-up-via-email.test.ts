import { API_URL, AppError } from '@/shared/api'

import { AuthViaEmailRequestSchema } from '../dto/auth-via-email.dto'
import { signUpViaEmail } from '../sign-up-via-email'

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

describe('signUpViaEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  const validBody = {
    email: 'user@example.com',
    password: 'password123',
  }

  it('should validate the body and call request with the correct arguments', async () => {
    requestMock.mockResolvedValueOnce({
      data: { accessToken: 'token-abc' },
      status: 200,
    })

    const result = await signUpViaEmail(validBody as never)

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_URL.AUTH.SIGN_UP_EMAIL,
        method: 'POST',
        json: validBody,
      }),
    )
    expect(result).toEqual({ accessToken: 'token-abc' })
  })

  it('should pass the parsed/validated body as json, not the raw input reference', async () => {
    const parseSpy = vi.spyOn(AuthViaEmailRequestSchema, 'parse')

    requestMock.mockResolvedValueOnce({
      data: { accessToken: 'token-abc' },
      status: 200,
    })

    await signUpViaEmail(validBody as never)

    expect(parseSpy).toHaveBeenCalledWith(validBody)
    expect(parseSpy).toHaveBeenCalledTimes(1)
  })

  it('should throw when the body fails schema validation', async () => {
    const invalidBody = { email: 'not-an-email' }

    await expect(signUpViaEmail(invalidBody as never)).rejects.toThrow()
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('should propagate errors thrown by request', async () => {
    requestMock.mockRejectedValueOnce(
      new AppError('SIGN_UP_EMAIL' as never, 'Email already in use'),
    )

    await expect(signUpViaEmail(validBody as never)).rejects.toBeInstanceOf(AppError)
  })

  it('should return the exact data and status shape from request', async () => {
    const response = { data: { accessToken: 'xyz' }, status: 201 }
    requestMock.mockResolvedValueOnce(response)

    const result = await signUpViaEmail(validBody as never)

    expect(result).toBe(response.data)
  })
})
