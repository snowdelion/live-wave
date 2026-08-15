import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useUserPopover } from '../../model/useUserPopover'

import { UserPopover } from './UserPopover'

vi.mock('../../model/useUserPopover', () => ({
  useUserPopover: vi.fn(),
}))

vi.mock('@/shared/ui', () => ({
  ConfirmModal: ({ open, onConfirm, onCancel, title, description, confirmLabel, itemName }: any) =>
    open ? (
      <div data-testid="confirm-modal">
        <span data-testid="modal-title">{title}</span>
        <span data-testid="modal-description">{description}</span>
        {itemName && <span data-testid="modal-item-name">{itemName}</span>}
        <button onClick={onConfirm}>{confirmLabel}</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

describe('UserPopover', () => {
  const mockSetShowConfirm = vi.fn()
  const mockHandleDeleteClick = vi.fn()
  const mockSettingsAction = vi.fn()
  const mockDeleteAction = vi.fn()

  const defaultMockReturn = {
    PANEL_BUTTONS: [
      {
        label: 'Settings',
        shouldShow: true,
        action: mockSettingsAction,
        isDanger: false,
        shouldShowConfirm: false,
      },
      {
        label: 'Delete Account',
        shouldShow: true,
        action: mockDeleteAction,
        isDanger: true,
        shouldShowConfirm: true,
      },
      {
        label: 'Hidden Option',
        shouldShow: false,
        action: vi.fn(),
        isDanger: false,
        shouldShowConfirm: false,
      },
    ],
    handleDeleteClick: mockHandleDeleteClick,
    showConfirm: false,
    setShowConfirm: mockSetShowConfirm,
    accountName: 'test@example.com',
    error: null,
    user: { email: 'test@example.com' },
    isUserError: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUserPopover).mockReturnValue(defaultMockReturn as any)
  })

  describe('Popover Button', () => {
    it('renders the button with the first letter of the user email', () => {
      render(<UserPopover />)
      expect(screen.getByRole('button')).toHaveTextContent('T')
    })

    it('renders empty string as fallback if user email is missing or undefined', () => {
      vi.mocked(useUserPopover).mockReturnValue({ ...defaultMockReturn, user: undefined })
      render(<UserPopover />)
      expect(screen.getByRole('button')).toHaveTextContent('')
    })
  })

  describe('Popover Panel', () => {
    it('opens the panel and shows visible buttons when the button is clicked', async () => {
      const user = userEvent.setup()
      render(<UserPopover />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Delete Account')).toBeInTheDocument()
      expect(screen.queryByText('Hidden Option')).not.toBeInTheDocument()
    })

    it('calls the action directly for non-confirm buttons', async () => {
      const user = userEvent.setup()
      render(<UserPopover />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Settings'))

      expect(mockSettingsAction).toHaveBeenCalledTimes(1)
      expect(mockHandleDeleteClick).not.toHaveBeenCalled()
    })

    it('calls handleDeleteClick for buttons with shouldShowConfirm', async () => {
      const user = userEvent.setup()
      render(<UserPopover />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Delete Account'))

      expect(mockHandleDeleteClick).toHaveBeenCalledTimes(1)
      expect(mockDeleteAction).not.toHaveBeenCalled()
    })

    it('renders the error message when an error is present', async () => {
      const user = userEvent.setup()
      vi.mocked(useUserPopover).mockReturnValue({
        ...defaultMockReturn,
        error: { message: 'Failed to load user data' },
      } as unknown as ReturnType<typeof useUserPopover>)

      render(<UserPopover />)
      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Failed to load user data')).toBeInTheDocument()
    })
  })

  describe('Confirm Modal', () => {
    it('renders ConfirmModal with correct props when showConfirm is true', async () => {
      const user = userEvent.setup()
      vi.mocked(useUserPopover).mockReturnValue({
        ...defaultMockReturn,
        showConfirm: true,
      } as unknown as ReturnType<typeof useUserPopover>)

      render(<UserPopover />)

      await user.click(screen.getByRole('button'))

      const modal = screen.getByTestId('confirm-modal')
      expect(within(modal).getByTestId('modal-title')).toHaveTextContent('DELETE ACCOUNT')
      expect(within(modal).getByTestId('modal-description')).toHaveTextContent(
        'This action cannot be undone. All your monitors and data will be permanently removed',
      )
      expect(within(modal).getByTestId('modal-item-name')).toHaveTextContent('test@example.com')
      expect(within(modal).getByRole('button', { name: 'Delete Account' })).toBeInTheDocument()
    })

    it('calls setShowConfirm(false) when Cancel is clicked in ConfirmModal', async () => {
      const user = userEvent.setup()
      vi.mocked(useUserPopover).mockReturnValue({
        ...defaultMockReturn,
        showConfirm: true,
      } as unknown as ReturnType<typeof useUserPopover>)

      render(<UserPopover />)
      await user.click(screen.getByRole('button'))

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockSetShowConfirm).toHaveBeenCalledWith(false)
    })

    it('calls the actual action when Confirm is clicked in ConfirmModal', async () => {
      const user = userEvent.setup()
      vi.mocked(useUserPopover).mockReturnValue({
        ...defaultMockReturn,
        showConfirm: true,
      } as unknown as ReturnType<typeof useUserPopover>)

      render(<UserPopover />)
      await user.click(screen.getByRole('button'))

      const modal = screen.getByTestId('confirm-modal')
      const confirmButton = within(modal).getByRole('button', { name: 'Delete Account' })
      await user.click(confirmButton)

      expect(mockDeleteAction).toHaveBeenCalledTimes(1)
    })
  })
})
