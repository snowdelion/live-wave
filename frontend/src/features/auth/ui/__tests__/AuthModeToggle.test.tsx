import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthModeToggle } from '../AuthModeToggle'

describe('AuthModeToggle', () => {
  describe('login mode', () => {
    it(`should show the "Don't have an account?" prompt`, () => {
      render(<AuthModeToggle isLogin onToggle={vi.fn()} />)

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    })

    it('should show a "Sign up" button', () => {
      render(<AuthModeToggle isLogin onToggle={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
    })

    it('should not show the "Sign in" button', () => {
      render(<AuthModeToggle isLogin onToggle={vi.fn()} />)

      expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
    })
  })

  describe('register mode', () => {
    it('should show the "Already have an account?" prompt', () => {
      render(<AuthModeToggle isLogin={false} onToggle={vi.fn()} />)

      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    })

    it('should show a "Sign in" button', () => {
      render(<AuthModeToggle isLogin={false} onToggle={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('should not show the "Sign up" button', () => {
      render(<AuthModeToggle isLogin={false} onToggle={vi.fn()} />)

      expect(screen.queryByRole('button', { name: 'Sign up' })).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('should call onToggle when the button is clicked in login mode', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()

      render(<AuthModeToggle isLogin onToggle={onToggle} />)

      await user.click(screen.getByRole('button', { name: 'Sign up' }))

      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('should call onToggle when the button is clicked in register mode', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()

      render(<AuthModeToggle isLogin={false} onToggle={onToggle} />)

      await user.click(screen.getByRole('button', { name: 'Sign in' }))

      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })
})
