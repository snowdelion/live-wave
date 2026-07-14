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
  const push = vi.fn()
  const authTelegramMutate = vi.fn()

  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useRouter).mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>)

    vi.mocked(useSignInTelegram).mockReturnValue({
      mutate: authTelegramMutate,
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

    it('should render the domain-invalid message when origin does not start with NEXT_PUBLIC_APP_URL', () => {
      setLocation('https://evil.com', 'https:')

      render(<OAuthButtons />)

      expect(
        screen.getByText('Login via Telegram is unavailable: domain is invalid'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('telegram-login-button')).not.toBeInTheDocument()
    })

    it('should render the domain-invalid message when NEXT_PUBLIC_APP_URL is unset and falls back to empty string match', () => {
      process.env.NEXT_PUBLIC_APP_URL = undefined
      setLocation('http://myapp.com', 'http:')

      render(<OAuthButtons />)

      expect(
        screen.getByText('Login via Telegram is unavailable: domain is invalid'),
      ).toBeInTheDocument()
    })
  })

  describe('telegram auth callback', () => {
    it('should call authTelegram mutate with the auth body when the callback fires', async () => {
      setLocation('https://myapp.com', 'https:')

      render(<OAuthButtons />)

      screen.getByTestId('telegram-login-button').click()

      expect(authTelegramMutate).toHaveBeenCalledWith({
        id: 1,
        first_name: 'John',
        auth_date: 123,
        hash: 'h',
      })
    })

    it('should navigate to /dashboard after the telegram auth callback fires', async () => {
      setLocation('https://myapp.com', 'https:')

      render(<OAuthButtons />)

      screen.getByTestId('telegram-login-button').click()

      expect(push).toHaveBeenCalledWith('/dashboard')
    })
  })
})
