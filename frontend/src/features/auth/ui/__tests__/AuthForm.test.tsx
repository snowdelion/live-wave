import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, type SubmitHandler } from 'react-hook-form'
import z from 'zod'

import { AuthForm } from '../AuthForm'

// helpers
const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
})

const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Values = z.infer<typeof registerSchema>

function TestHarness({
  isLogin = true,
  isSubmitting = false,
  showPassword = false,
  showConfirmPassword = false,
  incorrectError = '',
  onValidSubmit = vi.fn(),
  onToggleShowPassword = vi.fn(),
  onToggleShowConfirmPassword = vi.fn(),
  setIncorrectError = vi.fn(),
}: {
  isLogin?: boolean
  isSubmitting?: boolean
  showPassword?: boolean
  showConfirmPassword?: boolean
  incorrectError?: string
  onValidSubmit?: (data: Values) => void
  onToggleShowPassword?: () => void
  onToggleShowConfirmPassword?: () => void
  setIncorrectError?: (value: string) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<Values>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema) as any,
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  return (
    <AuthForm
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      isLogin={isLogin}
      incorrectError={incorrectError}
      onToggleShowPassword={onToggleShowPassword}
      onToggleShowConfirmPassword={onToggleShowConfirmPassword}
      onSubmit={handleSubmit(onValidSubmit as SubmitHandler<unknown>) as never}
      clearErrors={clearErrors}
      setIncorrectError={setIncorrectError}
    />
  )
}

// tests
describe('AuthForm', () => {
  describe('field rendering', () => {
    it('should render email and password fields in login mode', () => {
      render(<TestHarness isLogin />)

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    })

    it('should not render the confirm password field in login mode', () => {
      render(<TestHarness isLogin />)

      expect(screen.queryByPlaceholderText('Confirm your password')).not.toBeInTheDocument()
    })

    it('should render the confirm password field in register mode', () => {
      render(<TestHarness isLogin={false} />)

      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
    })
  })

  describe('submit button state', () => {
    it('should show "Sign in" label in login mode when not submitting', () => {
      render(<TestHarness isLogin isSubmitting={false} />)

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should show "Create account" label in register mode when not submitting', () => {
      render(<TestHarness isLogin={false} isSubmitting={false} />)

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should show "Signing in…" and disable the button when submitting in login mode', () => {
      render(<TestHarness isLogin isSubmitting />)

      const button = screen.getByRole('button', { name: /signing in/i })
      expect(button).toBeDisabled()
    })

    it('should show "Creating account…" and disable the button when submitting in register mode', () => {
      render(<TestHarness isLogin={false} isSubmitting />)

      const button = screen.getByRole('button', { name: /creating account/i })
      expect(button).toBeDisabled()
    })
  })

  describe('password visibility toggles', () => {
    it('should render password input as type="password" by default', () => {
      render(<TestHarness isLogin />)

      const input = screen.getByPlaceholderText('Enter your password')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should render password input as type="text" when showPassword is true', () => {
      render(<TestHarness isLogin showPassword />)

      const input = screen.getByPlaceholderText('Enter your password')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should call onToggleShowPassword when the password visibility button is clicked', async () => {
      const user = userEvent.setup()
      const onToggleShowPassword = vi.fn()

      render(<TestHarness isLogin onToggleShowPassword={onToggleShowPassword} />)

      const passwordContainer = screen.getByPlaceholderText('Enter your password').closest('div')
      const toggleButton = passwordContainer?.parentElement?.querySelector('button')

      expect(toggleButton).toBeTruthy()
      await user.click(toggleButton as HTMLButtonElement)

      expect(onToggleShowPassword).toHaveBeenCalledTimes(1)
    })

    it('should render confirm-password input as type="text" when showConfirmPassword is true', () => {
      render(<TestHarness isLogin={false} showConfirmPassword />)

      const input = screen.getByPlaceholderText('Confirm your password')
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  describe('validation errors', () => {
    it('should display a validation error for an invalid email after submit', async () => {
      const user = userEvent.setup()
      render(<TestHarness isLogin />)

      await user.type(screen.getByPlaceholderText('you@example.com'), 'not-an-email')
      await user.type(screen.getByPlaceholderText('Enter your password'), '123456')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(await screen.findByText('Invalid email')).toBeInTheDocument()
    })

    it('should display a validation error for a too-short password after submit', async () => {
      const user = userEvent.setup()
      render(<TestHarness isLogin />)

      await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com')
      await user.type(screen.getByPlaceholderText('Enter your password'), '123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
    })

    it('should display a mismatch error on confirmPassword in register mode', async () => {
      const user = userEvent.setup()
      render(<TestHarness isLogin={false} />)

      await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com')
      await user.type(screen.getByPlaceholderText('Enter your password'), '123456')
      await user.type(screen.getByPlaceholderText('Confirm your password'), '654321')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    })

    it('should clear the field error and call setIncorrectError when the user fixes the field', async () => {
      const user = userEvent.setup()
      const setIncorrectError = vi.fn()

      render(<TestHarness isLogin setIncorrectError={setIncorrectError} />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))
      expect(await screen.findByText('Invalid email')).toBeInTheDocument()

      await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com')

      await waitFor(() => {
        expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
      })
      expect(setIncorrectError).toHaveBeenCalledWith('')
    })
  })

  describe('form submission', () => {
    it('should call onValidSubmit with the entered values when the form is valid', async () => {
      const user = userEvent.setup()
      const onValidSubmit = vi.fn()

      render(<TestHarness isLogin onValidSubmit={onValidSubmit} />)

      await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com')
      await user.type(screen.getByPlaceholderText('Enter your password'), '123456')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onValidSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'a@b.com', password: '123456' }),
          expect.anything(),
        )
      })
    })

    it('should not call onValidSubmit when validation fails', async () => {
      const user = userEvent.setup()
      const onValidSubmit = vi.fn()

      render(<TestHarness isLogin onValidSubmit={onValidSubmit} />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await screen.findByText('Invalid email')
      expect(onValidSubmit).not.toHaveBeenCalled()
    })
  })

  describe('incorrectError display', () => {
    it('should display the incorrectError message when provided', () => {
      render(<TestHarness incorrectError="Invalid credentials" />)

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    it('should not display any error message when incorrectError is empty', () => {
      render(<TestHarness incorrectError="" />)

      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })
})
