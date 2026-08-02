import { render, screen } from '@testing-library/react'

import { useTimeline } from '@/entities/analytics'

import { LatencyChart } from '../LatencyChart'

vi.mock('@/entities/analytics', () => ({
  useTimeline: vi.fn(),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Area: (props: any) => <div data-testid="area" data-datakey={props.dataKey} />,
  Line: (props: any) => <div data-testid="line" data-datakey={props.dataKey} />,
  XAxis: (props: any) => <div data-testid="x-axis" data-datakey={props.dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('LatencyChart', () => {
  const monitorId = 'mon-123'
  const periodDays = 7

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading and error states', () => {
    it('renders skeleton when data is pending', () => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: true,
        data: undefined,
        error: null,
      } as any)

      render(<LatencyChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByText('LATENCY TIME')).toBeInTheDocument()
      expect(screen.getByText(/Average response & Percentile 95th over \d+d/)).toBeInTheDocument()

      const pulseElements = document.querySelectorAll('.animate-pulse')
      expect(pulseElements.length).toBeGreaterThan(0)
    })

    it('renders error component when there is an error', () => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: false,
        data: undefined,
        error: new Error('Failed to fetch'),
      } as any)

      render(<LatencyChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    const mockTimelineData = [
      { date: '2024-01-01', averageResponseTime: 120, p95ResponseTime: 150 },
      { date: '2024-01-02', averageResponseTime: 110, p95ResponseTime: 140 },
    ]

    beforeEach(() => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: false,
        data: mockTimelineData,
        error: null,
      } as any)
    })

    it('renders the chart title and period', () => {
      render(<LatencyChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByText('LATENCY TIME')).toBeInTheDocument()
      expect(screen.getByText('Average response & Percentile 95th over 7d')).toBeInTheDocument()
    })

    it('renders the recharts components with the correct data length', () => {
      render(<LatencyChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toHaveAttribute('data-length', '2')
    })

    it('passes the correct dataKeys to the axes, area, and line', () => {
      render(<LatencyChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('area')).toHaveAttribute('data-datakey', 'averageResponseTime')
      expect(screen.getByTestId('line')).toHaveAttribute('data-datakey', 'p95ResponseTime')
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-datakey', 'date')
    })
  })
})
