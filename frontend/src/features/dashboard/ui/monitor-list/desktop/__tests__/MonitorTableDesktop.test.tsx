import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useMonitorTable } from '../../../../model/useMonitorTable'
import { MonitorTableDesktop } from '../MonitorTableDesktop'

vi.mock('../../../../model/useMonitorTable', () => ({
  useMonitorTable: vi.fn(),
}))

vi.mock('@/shared/ui', () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    title: string
    description: string
    action?: React.ReactNode
  }) => (
    <div data-testid="empty-state">
      <span data-testid="empty-state-title">{title}</span>
      <span data-testid="empty-state-description">{description}</span>
      {action}
    </div>
  ),
}))

vi.mock('../MonitorRow', () => ({
  MonitorRow: ({ monitor, onEdit, setDeleteTarget }: any) => (
    <div data-testid={`monitor-row-${monitor.id}`}>
      <span>{monitor.name}</span>
      <button onClick={() => onEdit(monitor.id)}>Edit {monitor.id}</button>
      <button onClick={() => setDeleteTarget(monitor)}>Delete {monitor.id}</button>
    </div>
  ),
}))

vi.mock('../../../modals/DeleteConfirmModal', () => ({
  DeleteConfirmModal: ({
    monitor,
    onConfirm,
    onCancel,
    open,
  }: {
    monitor: { id: string; name: string }
    onConfirm: () => void
    onCancel: () => void
    open: boolean
  }) =>
    open ? (
      <div data-testid="delete-confirm-modal">
        <span>{monitor.name}</span>
        <button onClick={onConfirm}>Confirm delete</button>
        <button onClick={onCancel}>Cancel delete</button>
      </div>
    ) : null,
}))

function makeMonitor(overrides: Partial<{ id: string; name: string }> = {}) {
  return { id: 'mon_1', name: 'My Server', ...overrides } as never
}

function mockUseMonitorTable(overrides: Partial<ReturnType<typeof useMonitorTable>> = {}) {
  const base = {
    deleteMonitor: vi.fn(),
    deleteTarget: null,
    setDeleteTarget: vi.fn(),
    filtered: [],
    isEmpty: false,
    hasNoResults: false,
    noResultsTitle: '',
    noResultsDescription: '',
  }

  const merged = { ...base, ...overrides }
  vi.mocked(useMonitorTable).mockReturnValue(merged as never)
  return merged
}

describe('MonitorTableDesktop', () => {
  const onEdit = vi.fn()
  const onMonitorChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state (no monitors at all)', () => {
    it('should render the "no monitors yet" empty state when isEmpty is true', () => {
      mockUseMonitorTable({ isEmpty: true })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No monitors yet')
      expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
        'Create your first monitor to start tracking uptime and performance',
      )
    })

    it('should call onMonitorChange when the "Add monitor" action button is clicked', async () => {
      const user = userEvent.setup()
      mockUseMonitorTable({ isEmpty: true })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: /add monitor/i }))

      expect(onMonitorChange).toHaveBeenCalledTimes(1)
    })

    it('should not render the table or no-results state when isEmpty is true', () => {
      mockUseMonitorTable({ isEmpty: true, hasNoResults: true })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.getAllByTestId('empty-state')).toHaveLength(1)
      expect(screen.queryByText('Monitor')).not.toBeInTheDocument()
    })
  })

  describe('no-results state (filters applied but nothing matches)', () => {
    it('should render the no-results empty state with the given title/description', () => {
      mockUseMonitorTable({
        isEmpty: false,
        hasNoResults: true,
        noResultsTitle: 'No monitors found for "foo"',
        noResultsDescription: 'Try adjusting your search term',
      })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search="foo"
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
        'No monitors found for "foo"',
      )
      expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
        'Try adjusting your search term',
      )
    })

    it('should not render an "Add monitor" action button in the no-results state', () => {
      mockUseMonitorTable({
        isEmpty: false,
        hasNoResults: true,
        noResultsTitle: 'No monitors found',
        noResultsDescription: 'Try adjusting filters',
      })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search="foo"
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.queryByRole('button', { name: /add monitor/i })).not.toBeInTheDocument()
    })
  })

  describe('table rendering', () => {
    it('should render column headers', () => {
      mockUseMonitorTable({ filtered: [makeMonitor()] })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.getByText('Monitor')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Last Check')).toBeInTheDocument()
      expect(screen.getByText('Response')).toBeInTheDocument()
      expect(screen.getByText('Uptime 7d')).toBeInTheDocument()
      expect(screen.getByText('Trend')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should render a MonitorRow for each filtered monitor', () => {
      mockUseMonitorTable({
        filtered: [makeMonitor({ id: 'mon_1' }), makeMonitor({ id: 'mon_2' })],
      })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.getByTestId('monitor-row-mon_1')).toBeInTheDocument()
      expect(screen.getByTestId('monitor-row-mon_2')).toBeInTheDocument()
    })

    it('should pass onEdit through to MonitorRow', async () => {
      const user = userEvent.setup()
      mockUseMonitorTable({ filtered: [makeMonitor({ id: 'mon_1' })] })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Edit mon_1' }))

      expect(onEdit).toHaveBeenCalledWith('mon_1')
    })

    it('should call setDeleteTarget when a row triggers delete', async () => {
      const user = userEvent.setup()
      const { setDeleteTarget } = mockUseMonitorTable({
        filtered: [makeMonitor({ id: 'mon_1', name: 'My Server' })],
      })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Delete mon_1' }))

      expect(setDeleteTarget).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mon_1', name: 'My Server' }),
      )
    })

    it('should not render an empty state when there are filtered monitors', () => {
      mockUseMonitorTable({ filtered: [makeMonitor()] })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })

  describe('delete confirm modal', () => {
    it('should not render the modal when deleteTarget is null', () => {
      mockUseMonitorTable({ filtered: [makeMonitor()], deleteTarget: null })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument()
    })

    it('should render the modal when deleteTarget is set', () => {
      const target = makeMonitor({ id: 'mon_1', name: 'Target Server' })
      mockUseMonitorTable({ filtered: [target], deleteTarget: target })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      const modal = screen.getByTestId('delete-confirm-modal')
      expect(modal).toBeInTheDocument()
      expect(within(modal).getByText('Target Server')).toBeInTheDocument()
    })

    it('should call deleteMonitor with the target id and clear deleteTarget on confirm', async () => {
      const user = userEvent.setup()
      const target = makeMonitor({ id: 'mon_1', name: 'Target Server' })
      const { deleteMonitor, setDeleteTarget } = mockUseMonitorTable({
        filtered: [target],
        deleteTarget: target,
      })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      const modal = screen.getByTestId('delete-confirm-modal')
      await user.click(within(modal).getByRole('button', { name: 'Confirm delete' }))

      expect(deleteMonitor).toHaveBeenCalledWith('mon_1')
      expect(setDeleteTarget).toHaveBeenCalledWith(null)
    })

    it('should clear deleteTarget when the modal is cancelled', async () => {
      const user = userEvent.setup()
      const target = makeMonitor({ id: 'mon_1', name: 'Target Server' })
      const { deleteMonitor, setDeleteTarget } = mockUseMonitorTable({
        filtered: [target],
        deleteTarget: target,
      })

      render(
        <MonitorTableDesktop
          onEdit={onEdit}
          search=""
          typeFilter="ALL"
          onMonitorChange={onMonitorChange}
        />,
      )

      const modal = screen.getByTestId('delete-confirm-modal')
      await user.click(within(modal).getByRole('button', { name: 'Cancel delete' }))

      expect(setDeleteTarget).toHaveBeenCalledWith(null)
      expect(deleteMonitor).not.toHaveBeenCalled()
    })
  })
})
