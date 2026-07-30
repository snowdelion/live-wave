import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  const defaultProps = {
    open: true,
    onConfirm,
    onCancel,
    title: 'DELETE MONITOR',
    description: 'This will permanently delete the monitor and all its historical data',
    itemName: 'My production server',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility', () => {
    it('should render dialog content when open is true', async () => {
      render(<ConfirmModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('DELETE MONITOR')).toBeInTheDocument()
      })
    })

    it('should not render dialog content when open is false', () => {
      render(<ConfirmModal {...defaultProps} open={false} />)

      expect(screen.queryByText('DELETE MONITOR')).not.toBeInTheDocument()
    })
  })

  describe('content', () => {
    it('should show the confirmation description text', async () => {
      render(<ConfirmModal {...defaultProps} />)

      await waitFor(() => {
        expect(
          screen.getByText('This will permanently delete the monitor and all its historical data'),
        ).toBeInTheDocument()
      })
    })

    it("should display the item's name when provided", async () => {
      render(<ConfirmModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('My production server')).toBeInTheDocument()
      })
    })

    it('should not display the item name block when itemName is not provided', async () => {
      render(<ConfirmModal {...defaultProps} itemName={undefined as unknown as string} />)

      await waitFor(() => {
        expect(screen.getByText('DELETE MONITOR')).toBeInTheDocument()
      })

      expect(screen.queryByText('My production server')).not.toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should call onConfirm when the confirm button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmModal {...defaultProps} />)

      const confirmButton = await screen.findByRole('button', { name: 'Delete' })
      await user.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should call onCancel when the cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmModal {...defaultProps} />)

      const cancelButton = await screen.findByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should call onCancel when the close (X) button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmModal {...defaultProps} />)

      const closeButton = await screen.findByRole('button', { name: 'Close dialog' })
      await user.click(closeButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should allow custom confirm and cancel labels', async () => {
      render(
        <ConfirmModal {...defaultProps} confirmLabel="Yes, remove it" cancelLabel="No, keep it" />,
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes, remove it' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument()
      })
    })
  })
})
