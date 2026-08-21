import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'

import { useSignInTelegram } from '@/entities/auth'

import { OAuthButtons } from '../OAuthButtons'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/entities/auth', async () => {
  const actual = await vi.importActual('@/entities/auth')
  return {
    ...actual,
    useSignInTelegram: vi.fn(),
  }
})

vi.mock('@telegram-auth/react', () => ({
  LoginButton: (props: { onAuthCallback: (body: unknown) => void }) => (
    <button
      data-testid="telegram-login-button"
      onClick={() => props.onAuthCallback({ id: 1, first_name: 'John', auth_date: 123, hash: 'h' })}
    >
      Login with Telegram
    </button>
  ),
}))

function setLocation(origin: string, protocol: string) {
  Object.defineProperty(window, 'location', {
    value: {
      protocol,
      origin,
      href: origin,
    },
    writable: true,
    configurable: true,
  })
}

describe('OAuthButtons', () => {
  const replace = vi.fn()
  const authTelegramMutateAsync = vi.fn().mockResolvedValue({ accessToken: 'fake-token' })

  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>)

    vi.mocked(useSignInTelegram).mockReturnValue({
      mutateAsync: authTelegramMutateAsync,
    } as never)

    process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv
  })

  describe('domain validation', () => {
    it('should render the Telegram login button when https and origin matches NEXT_PUBLIC_APP_URL', () => {
      setLocation('https://myapp.com', 'https:')
      render(<OAuthButtons />)
      expect(screen.getByTestId('telegram-login-button')).toBeInTheDocument()
    })

    it('should render the domain-invalid message when protocol is not https', () => {
      setLocation('http://myapp.com', 'http:')
      render(<OAuthButtons />)
      expect(
        screen.getByText('Login via Telegram is unavailable: domain is invalid'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('telegram-login-button')).not.toBeInTheDocument()
    })

    it('should render the domain-invalid message when origin does not match NEXT_PUBLIC_APP_URL', () => {
      setLocation('https://evil.com', 'https:')
      render(<OAuthButtons />)
      expect(
        screen.getByText('Login via Telegram is unavailable: domain is invalid'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('telegram-login-button')).not.toBeInTheDocument()
    })
  })

  describe('telegram auth callback', () => {
    it('should call authTelegram mutateAsync with the auth body when the callback fires', async () => {
      setLocation('https://myapp.com', 'https:')
      render(<OAuthButtons />)

      screen.getByTestId('telegram-login-button').click()

      await vi.waitFor(() => {
        expect(authTelegramMutateAsync).toHaveBeenCalledWith({
          id: 1,
          first_name: 'John',
          auth_date: 123,
          hash: 'h',
        })
      })
    })

    it('should navigate to /dashboard after the telegram auth callback fires', async () => {
      setLocation('https://myapp.com', 'https:')
      render(<OAuthButtons />)

      screen.getByTestId('telegram-login-button').click()

      await vi.waitFor(() => {
        expect(replace).toHaveBeenCalledWith('/dashboard')
      })
    })
  })
})
