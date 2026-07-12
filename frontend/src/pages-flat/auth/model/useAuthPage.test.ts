import { act, renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation'

import { useSignInEmail, useSignUpEmail } from '@/entities/auth'

import { useAuthPage } from './useAuthPage'

// mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/entities/auth', async () => {
  const actual = await vi.importActual('@/entities/auth')
  return {
    ...actual,
    useSignInEmail: vi.fn(),
    useSignUpEmail: vi.fn(),
  }
})

let capturedOnValid: ((data: unknown) => void) | undefined

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn(),
      formState: { errors: {} },
      clearErrors: vi.fn(),
      handleSubmit: (onValid: (data: unknown) => void) => {
        capturedOnValid = onValid
        return (e: { preventDefault?: () => void }) => {
          e?.preventDefault?.()
        }
      },
    }),
  }
})

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}))

// tests
describe('useAuthPage', () => {
  const replace = vi.fn()
  const signInMutate = vi.fn()
  const signUpMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnValid = undefined

    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>)

    vi.mocked(useSignInEmail).mockReturnValue({
      mutate: signInMutate,
      isPending: false,
    } as never)

    vi.mocked(useSignUpEmail).mockReturnValue({
      mutate: signUpMutate,
      isPending: false,
    } as never)
  })

  function triggerSubmit(
    result: { current: ReturnType<typeof useAuthPage> },
    formValues: { email: string; password: string; confirmPassword?: string },
  ) {
    act(() => {
      result.current.onSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(capturedOnValid).toBeDefined()

    act(() => {
      capturedOnValid!(formValues)
    })
  }

  describe('currentMutate - login mode', () => {
    it('should call signInEmail (not signUpEmail) with email/password when in login mode', () => {
      const { result } = renderHook(() => useAuthPage())

      triggerSubmit(result, { email: 'a@b.com', password: '123456', confirmPassword: '123456' })

      expect(signInMutate).toHaveBeenCalledTimes(1)
      expect(signInMutate).toHaveBeenCalledWith(
        { email: 'a@b.com', password: '123456' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      )
      expect(signUpMutate).not.toHaveBeenCalled()
    })

    it('should strip confirmPassword from the payload before calling signInEmail', () => {
      const { result } = renderHook(() => useAuthPage())

      triggerSubmit(result, { email: 'a@b.com', password: '123456', confirmPassword: '123456' })

      const [payload] = (signInMutate as any).mock.calls[0]
      expect(payload).not.toHaveProperty('confirmPassword')
    })

    it('should navigate to /dashboard when signInEmail succeeds', () => {
      const { result } = renderHook(() => useAuthPage())

      triggerSubmit(result, { email: 'a@b.com', password: '123456' })

      const [_, options] = (signInMutate as any).mock.calls[0]
      act(() => {
        options.onSuccess()
      })

      expect(replace).toHaveBeenCalledWith('/dashboard')
    })

    it('should set incorrectError when signInEmail fails', () => {
      const { result } = renderHook(() => useAuthPage())

      triggerSubmit(result, { email: 'a@b.com', password: '123456' })

      const [_, options] = (signInMutate as any).mock.calls[0]
      act(() => {
        options.onError({ message: 'Invalid credentials' })
      })

      expect(result.current.incorrectError).toBe('Invalid credentials')
    })
  })

  describe('currentMutate - register mode', () => {
    it('should call signUpEmail (not signInEmail) with email/password when in register mode', () => {
      const { result } = renderHook(() => useAuthPage())

      act(() => {
        result.current.setMode('register')
      })

      triggerSubmit(result, { email: 'a@b.com', password: '123456', confirmPassword: '123456' })

      expect(signUpMutate).toHaveBeenCalledTimes(1)
      expect(signUpMutate).toHaveBeenCalledWith(
        { email: 'a@b.com', password: '123456' },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      )
      expect(signInMutate).not.toHaveBeenCalled()
    })

    it('should navigate to /dashboard when signUpEmail succeeds', () => {
      const { result } = renderHook(() => useAuthPage())

      act(() => {
        result.current.setMode('register')
      })

      triggerSubmit(result, { email: 'a@b.com', password: '123456', confirmPassword: '123456' })

      const [_, options] = (signUpMutate as any).mock.calls[0]
      act(() => {
        options.onSuccess()
      })

      expect(replace).toHaveBeenCalledWith('/dashboard')
    })

    it('should set incorrectError when signUpEmail fails', () => {
      const { result } = renderHook(() => useAuthPage())

      act(() => {
        result.current.setMode('register')
      })

      triggerSubmit(result, { email: 'a@b.com', password: '123456', confirmPassword: '123456' })

      const [_, options] = (signUpMutate as any).mock.calls[0]
      act(() => {
        options.onError({ message: 'Email already in use' })
      })

      expect(result.current.incorrectError).toBe('Email already in use')
    })
  })

  describe('onSubmit', () => {
    it('should reset incorrectError to empty string before mutating', () => {
      const { result } = renderHook(() => useAuthPage())

      act(() => {
        result.current.setIncorrectError('stale error')
      })
      expect(result.current.incorrectError).toBe('stale error')

      triggerSubmit(result, { email: 'a@b.com', password: '123456' })

      expect(result.current.incorrectError).toBe('')
    })
  })
})
