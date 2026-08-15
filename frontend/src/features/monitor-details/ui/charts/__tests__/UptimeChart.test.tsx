import { render, screen } from '@testing-library/react'

import { useTimeline } from '@/entities/analytics'
import { useIsResizing } from '@/shared/lib'

import { UptimeChart } from '../UptimeChart'

vi.mock('@/entities/analytics', () => ({
  useTimeline: vi.fn(),
}))

vi.mock('@/shared/lib', () => ({
  useIsResizing: vi.fn(),
}))

vi.mock('../MonitorDetailsChartError', () => ({
  MonitorDetailsChartError: ({ periodDays }: any) => (
    <div data-testid="chart-error">Error {periodDays}</div>
  ),
}))

vi.mock('../MonitorDetailsChartSkeleton', () => ({
  MonitorDetailsChartSkeleton: ({ periodDays }: any) => (
    <div data-testid="chart-skeleton">Skeleton {periodDays}</div>
  ),
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
  XAxis: (props: any) => <div data-testid="x-axis" data-datakey={props.dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('UptimeChart', () => {
  const monitorId = 'mon-123'
  const periodDays = 7

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useIsResizing).mockReturnValue(false)
  })

  describe('loading and error states', () => {
    it('renders skeleton when data is pending', () => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: true,
        data: undefined,
        error: null,
      } as any)

      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('chart-skeleton')).toHaveTextContent(`Skeleton ${periodDays}`)
    })

    it('renders skeleton when window is resizing', () => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: false,
        data: [{ date: '2024-01-01', uptime: 100 }],
        error: null,
      } as any)
      vi.mocked(useIsResizing).mockReturnValue(true)

      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    })

    it('renders error component when there is an error', () => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: false,
        data: undefined,
        error: new Error('Failed to fetch'),
      } as any)

      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('chart-error')).toBeInTheDocument()
      expect(screen.getByTestId('chart-error')).toHaveTextContent(`Error ${periodDays}`)
    })
  })

  describe('success state', () => {
    const mockTimelineData = [
      { date: '2024-01-01', uptime: 99.9 },
      { date: '2024-01-02', uptime: 100 },
      { date: '2024-01-03', uptime: 98.5 },
    ]

    beforeEach(() => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: false,
        data: mockTimelineData,
        error: null,
      } as any)
    })

    it('renders the chart title and period', () => {
      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByText('UPTIME %')).toBeInTheDocument()
      expect(screen.getByText('Uptime over 7d')).toBeInTheDocument()
    })

    it('renders the recharts components with the correct data length', () => {
      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toHaveAttribute('data-length', '3')
    })

    it('passes the correct dataKeys to the axes and area', () => {
      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('area')).toHaveAttribute('data-datakey', 'uptime')
      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-datakey', 'date')
    })

    it('duplicates the timeline item if there is only one data point', () => {
      vi.mocked(useTimeline).mockReturnValue({
        isPending: false,
        data: [{ date: '2024-01-01', uptime: 99.9 }],
        error: null,
      } as any)

      render(<UptimeChart monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByTestId('area-chart')).toHaveAttribute('data-length', '2')
    })
  })
})
