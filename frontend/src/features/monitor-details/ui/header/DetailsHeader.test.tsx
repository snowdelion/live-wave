import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MonitorStatus, useDetailedMonitor } from '@/entities/monitor'

import { DetailsHeader } from './DetailsHeader'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./DetailsHeaderSkeleton', () => ({
  DetailsHeaderSkeleton: () => <div data-testid="skeleton">Loading header...</div>,
}))

vi.mock('./DetailsHeaderError', () => ({
  DetailsHeaderError: () => <div data-testid="error-state">Error loading monitor</div>,
}))

vi.mock('@/entities/monitor', () => ({
  MonitorStatus: {
    up: 'up',
    down: 'down',
  },
  useDetailedMonitor: vi.fn(),
}))

describe('DetailsHeader', () => {
  const mockSetShowEdit = vi.fn()
  const mockSetShowDeleteConfirm = vi.fn()
  const monitorId = 'mon-123'

  const defaultProps = {
    monitorId,
    setShowEdit: mockSetShowEdit,
    setShowDeleteConfirm: mockSetShowDeleteConfirm,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading and error states', () => {
    it('renders skeleton when data is pending', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: true,
        isError: false,
        data: undefined,
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders error state when there is an error', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: true,
        data: undefined,
        error: new Error('Failed to fetch'),
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      expect(screen.getByTestId('error-state')).toBeInTheDocument()
    })
  })

  describe('content rendering', () => {
    it('renders monitor name and UP status correctly with green styling', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: { name: 'My Production API', lastStatus: MonitorStatus.up },
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      expect(screen.getByText('My Production API')).toBeInTheDocument()
      expect(screen.getByText(MonitorStatus.up)).toBeInTheDocument()

      const statusBadge = screen.getByText(MonitorStatus.up).closest('span')
      expect(statusBadge).toHaveClass('text-[#00e676]')
      expect(statusBadge).toHaveClass('bg-[rgba(0,230,118,0.08)]')
    })

    it('renders monitor name and DOWN status correctly with red styling', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: { name: 'My Production API', lastStatus: MonitorStatus.down },
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      expect(screen.getByText('My Production API')).toBeInTheDocument()
      expect(screen.getByText(MonitorStatus.down)).toBeInTheDocument()

      const statusBadge = screen.getByText(MonitorStatus.down).closest('span')
      expect(statusBadge).toHaveClass('text-[#f44336]')
      expect(statusBadge).toHaveClass('bg-[rgba(244,67,54,0.08)]')
    })

    it('renders the back to dashboard link', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: { name: 'My API', lastStatus: MonitorStatus.up },
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      const backLink = screen.getByRole('link', { name: /back to dashboard/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('actions', () => {
    it('calls setShowEdit when Edit button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: { name: 'My API', lastStatus: MonitorStatus.up },
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /edit/i }))

      expect(mockSetShowEdit).toHaveBeenCalledWith(true)
      expect(mockSetShowDeleteConfirm).not.toHaveBeenCalled()
    })

    it('calls setShowDeleteConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: { name: 'My API', lastStatus: MonitorStatus.up },
      } as any)

      render(<DetailsHeader {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      expect(mockSetShowDeleteConfirm).toHaveBeenCalledWith(true)
      expect(mockSetShowEdit).not.toHaveBeenCalled()
    })
  })
})
