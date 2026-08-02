import { render, screen } from '@testing-library/react'

import { useIncidents } from '@/entities/analytics'

import { Incidents } from './Incidents'

vi.mock('@/entities/analytics', () => ({
  useIncidents: vi.fn(),
}))

vi.mock('./IncidentRow', () => ({
  IncidentRow: ({ incident, index }: any) => (
    <div data-testid={`incident-row-${incident.id}`}>Row {index}</div>
  ),
}))

vi.mock('./IncidentsSkeleton', () => ({
  IncidentsSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}))

vi.mock('./IncidentsError', () => ({
  IncidentsError: () => <div data-testid="error-state">Error</div>,
}))

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  CheckCircle2: () => <svg data-testid="check-icon" />,
}))

describe('Incidents', () => {
  const monitorId = 'mon-123'
  const periodDays = 7
  const mockOnIncidentChange = vi.fn()

  const defaultProps = {
    monitorId,
    onIncidentChange: mockOnIncidentChange,
    periodDays,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading and error states', () => {
    it('renders loading state when pending', () => {
      vi.mocked(useIncidents).mockReturnValue({
        isPending: true,
        data: undefined,
        error: null,
      } as any)

      render(<Incidents {...defaultProps} />)

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders error state when there is an error', () => {
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        data: undefined,
        error: new Error('Failed to fetch'),
      } as any)

      render(<Incidents {...defaultProps} />)

      expect(screen.getByTestId('error-state')).toBeInTheDocument()
    })
  })

  describe('empty state (no incidents)', () => {
    beforeEach(() => {
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        error: null,
        data: { total: 0, incidents: [] },
      } as any)
    })

    it('renders the header and empty state message', () => {
      render(<Incidents {...defaultProps} />)

      expect(screen.getByText('RECENT INCIDENTS')).toBeInTheDocument()
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
      expect(screen.getByText('No incidents in the last 7 days')).toBeInTheDocument()
    })

    it('does not render the total badge when total is 0', () => {
      render(<Incidents {...defaultProps} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  describe('success state (with incidents)', () => {
    const mockIncidents = [
      {
        id: 'inc-1',
        startAt: new Date(),
        endAt: new Date(),
        durationMs: 1000,
        cause: 'Timeout',
        status: 'Resolved',
        formattedDuration: '1s',
      },
      {
        id: 'inc-2',
        startAt: new Date(),
        endAt: null,
        durationMs: null,
        cause: 'Down',
        status: 'Active',
        formattedDuration: 'Active',
      },
    ]

    beforeEach(() => {
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        error: null,
        data: { total: 2, incidents: mockIncidents },
      } as any)
    })

    it('renders the header and the total badge`', () => {
      render(<Incidents {...defaultProps} />)

      expect(screen.getByText('RECENT INCIDENTS')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('does not render the empty state message', () => {
      render(<Incidents {...defaultProps} />)

      expect(screen.queryByText(/No incidents in the last/)).not.toBeInTheDocument()
    })

    it('renders an IncidentRow for each incident with correct props', () => {
      render(<Incidents {...defaultProps} />)

      expect(screen.getByTestId('incident-row-inc-1')).toBeInTheDocument()
      expect(screen.getByTestId('incident-row-inc-2')).toBeInTheDocument()

      expect(screen.getByTestId('incident-row-inc-1')).toHaveTextContent('Row 0')
      expect(screen.getByTestId('incident-row-inc-2')).toHaveTextContent('Row 1')
    })
  })
})
