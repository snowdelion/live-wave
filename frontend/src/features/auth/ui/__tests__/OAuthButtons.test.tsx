import { render, screen } from '@testing-library/react'

import { API_URL } from '@/shared/api'

import { OAuthButtons } from '../OAuthButtons'

vi.mock('@telegram-auth/react', () => ({
  LoginButton: ({ authCallbackUrl }: { authCallbackUrl: string }) => (
    <button data-testid="telegram-login-button" data-callback-url={authCallbackUrl}>
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
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    vi.clearAllMocks()
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
    it('should pass the correct authCallbackUrl to the LoginButton', () => {
      setLocation('https://myapp.com', 'https:')
      render(<OAuthButtons />)

      const button = screen.getByTestId('telegram-login-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-callback-url', API_URL.AUTH.SIGN_IN_TELEGRAM)
    })
  })
})
