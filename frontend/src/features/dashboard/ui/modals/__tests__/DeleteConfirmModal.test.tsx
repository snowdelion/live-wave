import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { UserMonitor } from '@/entities/monitor'

import { DeleteConfirmModal } from '../DeleteConfirmModal'

async function renderModal(ui: React.ReactElement) {
  const utils = render(ui)
  await act(async () => {
    await Promise.resolve()
  })
  return utils
}

describe('DeleteConfirmModal', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  const monitor = { id: 'mon_1', name: 'My production server' } as UserMonitor

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility', () => {
    it('should render dialog content when open is true', async () => {
      await renderModal(
        <DeleteConfirmModal open monitor={monitor} onConfirm={onConfirm} onCancel={onCancel} />,
      )

      expect(screen.getByText('DELETE MONITOR')).toBeInTheDocument()
    })

    it('should not render dialog content when open is false', async () => {
      await renderModal(
        <DeleteConfirmModal
          open={false}
          monitor={monitor}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      )

      expect(screen.queryByText('DELETE MONITOR')).not.toBeInTheDocument()
    })
  })

  describe('content', () => {
    it('should show the confirmation description text', async () => {
      await renderModal(
        <DeleteConfirmModal open monitor={monitor} onConfirm={onConfirm} onCancel={onCancel} />,
      )

      expect(
        screen.getByText('This will permanently delete the monitor and all its historical data'),
      ).toBeInTheDocument()
    })

    it("should display the monitor's name", async () => {
      await renderModal(
        <DeleteConfirmModal open monitor={monitor} onConfirm={onConfirm} onCancel={onCancel} />,
      )

      expect(screen.getByText('My production server')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should call onConfirm when the Delete button is clicked', async () => {
      const user = userEvent.setup()
      await renderModal(
        <DeleteConfirmModal open monitor={monitor} onConfirm={onConfirm} onCancel={onCancel} />,
      )

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should call onCancel when the Cancel button is clicked', async () => {
      const user = userEvent.setup()
      await renderModal(
        <DeleteConfirmModal open monitor={monitor} onConfirm={onConfirm} onCancel={onCancel} />,
      )

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('should call onCancel when the close (X) button is clicked', async () => {
      const user = userEvent.setup()
      await renderModal(
        <DeleteConfirmModal open monitor={monitor} onConfirm={onConfirm} onCancel={onCancel} />,
      )

      await user.click(screen.getByRole('button', { name: 'Close dialog' }))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })
})
