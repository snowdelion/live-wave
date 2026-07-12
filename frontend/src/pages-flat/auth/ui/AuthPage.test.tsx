import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAuthPage } from '../model/useAuthPage'

import { AuthPage } from './AuthPage'

// mocks
vi.mock('../model/useAuthPage', () => ({
  useAuthPage: vi.fn(),
}))

vi.mock('@/features/auth', () => ({
  AuthBackground: () => <div data-testid="auth-background" />,
  AuthHeader: ({ isLogin }: { isLogin: boolean }) => (
    <div data-testid="auth-header">{isLogin ? 'login-header' : 'register-header'}</div>
  ),
  OAuthButtons: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="oauth-buttons" onClick={onClick}>
      OAuth
    </button>
  ),
  AuthForm: (props: Record<string, unknown>) => (
    <div data-testid="auth-form">
      <button data-testid="submit-form" onClick={props.onSubmit as never}>
        submit
      </button>
      <button data-testid="toggle-password" onClick={props.onToggleShowPassword as never}>
        toggle password
      </button>
      <button
        data-testid="toggle-confirm-password"
        onClick={props.onToggleShowConfirmPassword as never}
      >
        toggle confirm password
      </button>
      <span data-testid="is-submitting">{String(props.isSubmitting)}</span>
      <span data-testid="show-password">{String(props.showPassword)}</span>
      <span data-testid="show-confirm-password">{String(props.showConfirmPassword)}</span>
      <span data-testid="incorrect-error">{props.incorrectError as string}</span>
    </div>
  ),
  AuthModeToggle: ({ isLogin, onToggle }: { isLogin: boolean; onToggle: () => void }) => (
    <button data-testid="mode-toggle" onClick={onToggle}>
      {isLogin ? 'to-register' : 'to-login'}
    </button>
  ),
}))

function mockUseAuthPage(overrides: Partial<ReturnType<typeof useAuthPage>> = {}) {
  const base = {
    isLogin: true,
    register: vi.fn(),
    errors: {},
    isPending: false,
    showPassword: false,
    showConfirmPassword: false,
    incorrectError: '',
    setIncorrectError: vi.fn(),
    setShowPassword: vi.fn(),
    setShowConfirmPassword: vi.fn(),
    clearErrors: vi.fn(),
    setMode: vi.fn(),
    onSubmit: vi.fn(),
  }

  const merged = { ...base, ...overrides }
  vi.mocked(useAuthPage).mockReturnValue(merged as never)
  return merged
}

// tests
describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the background, header, oauth buttons, form, and mode toggle', () => {
    mockUseAuthPage()

    render(<AuthPage />)

    expect(screen.getByTestId('auth-background')).toBeInTheDocument()
    expect(screen.getByTestId('auth-header')).toBeInTheDocument()
    expect(screen.getByTestId('oauth-buttons')).toBeInTheDocument()
    expect(screen.getByTestId('auth-form')).toBeInTheDocument()
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument()
  })

  it('should pass isLogin=true to AuthHeader when in login mode', () => {
    mockUseAuthPage({ isLogin: true })

    render(<AuthPage />)

    expect(screen.getByTestId('auth-header')).toHaveTextContent('login-header')
  })

  it('should pass isLogin=false to AuthHeader when in register mode', () => {
    mockUseAuthPage({ isLogin: false })

    render(<AuthPage />)

    expect(screen.getByTestId('auth-header')).toHaveTextContent('register-header')
  })

  it('should pass isPending as isSubmitting to AuthForm', () => {
    mockUseAuthPage({ isPending: true })

    render(<AuthPage />)

    expect(screen.getByTestId('is-submitting')).toHaveTextContent('true')
  })

  it('should pass showPassword and showConfirmPassword through to AuthForm', () => {
    mockUseAuthPage({ showPassword: true, showConfirmPassword: true })

    render(<AuthPage />)

    expect(screen.getByTestId('show-password')).toHaveTextContent('true')
    expect(screen.getByTestId('show-confirm-password')).toHaveTextContent('true')
  })

  it('should pass incorrectError through to AuthForm', () => {
    mockUseAuthPage({ incorrectError: 'Invalid credentials' })

    render(<AuthPage />)

    expect(screen.getByTestId('incorrect-error')).toHaveTextContent('Invalid credentials')
  })

  it('should call onSubmit from useAuthPage when the form submit is triggered', async () => {
    const user = userEvent.setup()
    const { onSubmit } = mockUseAuthPage()

    render(<AuthPage />)

    await user.click(screen.getByTestId('submit-form'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('should toggle showPassword via setShowPassword updater when the toggle button is clicked', async () => {
    const user = userEvent.setup()
    const { setShowPassword } = mockUseAuthPage()

    render(<AuthPage />)

    await user.click(screen.getByTestId('toggle-password'))

    expect(setShowPassword).toHaveBeenCalledTimes(1)
    const updater = (setShowPassword as any).mock.calls[0][0]
    expect(updater(false)).toBe(true)
    expect(updater(true)).toBe(false)
  })

  it('should toggle showConfirmPassword via setShowConfirmPassword updater when the toggle button is clicked', async () => {
    const user = userEvent.setup()
    const { setShowConfirmPassword } = mockUseAuthPage()

    render(<AuthPage />)

    await user.click(screen.getByTestId('toggle-confirm-password'))

    expect(setShowConfirmPassword).toHaveBeenCalledTimes(1)
    const updater = (setShowConfirmPassword as any).mock.calls[0][0]
    expect(updater(false)).toBe(true)
    expect(updater(true)).toBe(false)
  })

  it('should switch mode from login to register, clear errors, and reset incorrectError when toggled', async () => {
    const user = userEvent.setup()
    const { setMode, clearErrors, setIncorrectError } = mockUseAuthPage({ isLogin: true })

    render(<AuthPage />)

    await user.click(screen.getByTestId('mode-toggle'))

    expect(setMode).toHaveBeenCalledWith('register')
    expect(clearErrors).toHaveBeenCalledTimes(1)
    expect(setIncorrectError).toHaveBeenCalledWith('')
  })

  it('should switch mode from register to login when toggled', async () => {
    const user = userEvent.setup()
    const { setMode } = mockUseAuthPage({ isLogin: false })

    render(<AuthPage />)

    await user.click(screen.getByTestId('mode-toggle'))

    expect(setMode).toHaveBeenCalledWith('login')
  })
})
