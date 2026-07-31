import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useDetailedMonitor } from '@/entities/monitor'

import { PeriodSwitcher } from './PeriodSwitcher'

vi.mock('@/entities/monitor', () => ({
  useDetailedMonitor: vi.fn(),
}))

vi.mock('./PeriodSwitcherSkeleton', () => ({
  PeriodSwitcherSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}))

vi.mock('./PeriodSwitcherError', () => ({
  PeriodSwitcherError: () => <div data-testid="error">Error loading</div>,
}))

describe('PeriodSwitcher', () => {
  const mockSetPeriodDays = vi.fn()
  const monitorId = 'mon-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading and error states', () => {
    it('renders skeleton when data is pending', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: true,
        data: undefined,
        error: null,
      } as any)

      render(
        <PeriodSwitcher monitorId={monitorId} periodDays={7} setPeriodDays={mockSetPeriodDays} />,
      )

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders error component when there is an error', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        data: undefined,
        error: new Error('Failed to fetch'),
      } as any)

      render(
        <PeriodSwitcher monitorId={monitorId} periodDays={7} setPeriodDays={mockSetPeriodDays} />,
      )

      expect(screen.getByTestId('error')).toBeInTheDocument()
    })
  })

  describe('content rendering', () => {
    it('renders the title and monitor domain on success', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        data: { domain: 'api.example.com' },
        error: null,
      } as any)

      render(
        <PeriodSwitcher monitorId={monitorId} periodDays={7} setPeriodDays={mockSetPeriodDays} />,
      )

      expect(screen.getByText('MONITOR DETAILS')).toBeInTheDocument()
      expect(screen.getByText('api.example.com')).toBeInTheDocument()
    })

    it('renders the period buttons (3d, 7d, 30d)', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        data: { domain: 'example.com' },
        error: null,
      } as any)

      render(
        <PeriodSwitcher monitorId={monitorId} periodDays={7} setPeriodDays={mockSetPeriodDays} />,
      )

      expect(screen.getByRole('button', { name: '3d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument()
    })
  })

  describe('active state styling', () => {
    it('applies active classes to the selected period button', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        data: { domain: 'example.com' },
        error: null,
      } as any)

      render(
        <PeriodSwitcher monitorId={monitorId} periodDays={7} setPeriodDays={mockSetPeriodDays} />,
      )

      const activeButton = screen.getByRole('button', { name: '7d' })
      expect(activeButton.className).toContain('bg-[#00e676]')
      expect(activeButton.className).toContain('text-[#080a08]')
      expect(activeButton.className).toContain('font-semibold')

      const inactiveButton = screen.getByRole('button', { name: '3d' })
      expect(inactiveButton.className).toContain('bg-transparent')
      expect(inactiveButton.className).toContain('text-[#4caf50]')
    })
  })

  describe('actions', () => {
    it('calls setPeriodDays with the correct value when a button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        data: { domain: 'example.com' },
        error: null,
      } as any)

      render(
        <PeriodSwitcher monitorId={monitorId} periodDays={7} setPeriodDays={mockSetPeriodDays} />,
      )

      await user.click(screen.getByRole('button', { name: '30d' }))

      expect(mockSetPeriodDays).toHaveBeenCalledWith(30)
      expect(mockSetPeriodDays).toHaveBeenCalledTimes(1)
    })
  })
})
