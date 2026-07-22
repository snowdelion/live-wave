import { render, screen } from '@testing-library/react'

import { useMonitors, MonitorStatus } from '@/entities/monitor'

import { StatsCards } from '../StatsCards'

vi.mock('lucide-react', () => ({
  Monitor: (props: any) => <svg data-testid="icon-monitor" {...props} />,
  TrendingUp: (props: any) => <svg data-testid="icon-trending" {...props} />,
  AlertTriangle: (props: any) => <svg data-testid="icon-alert" {...props} />,
  Gauge: (props: any) => <svg data-testid="icon-gauge" {...props} />,
}))

vi.mock('../StatsCardsSkeleton', () => ({
  StatsCardsSkeleton: () => <div data-testid="skeleton">Loading stats...</div>,
}))

vi.mock('@/entities/monitor', () => ({
  MonitorStatus: { up: 'up', down: 'down' },
  useMonitors: vi.fn(),
}))

describe('StatsCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the skeleton when data is pending', () => {
    vi.mocked(useMonitors).mockReturnValue({
      isPending: true,
      data: { monitors: [] },
    } as any)

    render(<StatsCards />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Monitors')).not.toBeInTheDocument()
  })

  it('renders zero values when there are no monitors', () => {
    vi.mocked(useMonitors).mockReturnValue({
      isPending: false,
      data: { monitors: [] },
    } as any)

    render(<StatsCards />)

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()

    expect(screen.getByText(/Monitors/i)).toBeInTheDocument()
    expect(screen.getByText('0 UP · 0 DOWN')).toBeInTheDocument()

    expect(screen.getByText(/Uptime/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()

    expect(screen.getByText(/Incidents/i)).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText(/Latency/i)).toBeInTheDocument()
    expect(screen.getByText('0 ms')).toBeInTheDocument()
  })

  it('calculates and displays correct stats for populated monitors', () => {
    const mockMonitors = [
      { id: '1', lastStatus: MonitorStatus.up, weekUptime: '100', trend: { avgResponseTime: 100 } },
      { id: '2', lastStatus: MonitorStatus.up, weekUptime: '80', trend: { avgResponseTime: 200 } },
      {
        id: '3',
        lastStatus: MonitorStatus.down,
        weekUptime: '50',
        trend: { avgResponseTime: null },
      },
    ]

    vi.mocked(useMonitors).mockReturnValue({
      isPending: false,
      data: { monitors: mockMonitors },
    } as any)

    render(<StatsCards />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2 UP · 1 DOWN')).toBeInTheDocument()

    expect(screen.getByText('77%')).toBeInTheDocument()

    expect(screen.getByText('1')).toBeInTheDocument()

    expect(screen.getByText('150 ms')).toBeInTheDocument()
  })

  it('handles invalid uptime and response time data gracefully', () => {
    const mockMonitors = [
      {
        id: '1',
        lastStatus: MonitorStatus.up,
        weekUptime: 'invalid',
        trend: { avgResponseTime: 'NaN' },
      },
      {
        id: '2',
        lastStatus: MonitorStatus.down,
        weekUptime: undefined,
        trend: { avgResponseTime: undefined },
      },
    ]

    vi.mocked(useMonitors).mockReturnValue({
      isPending: false,
      data: { monitors: mockMonitors },
    } as any)

    render(<StatsCards />)

    expect(screen.getByText('0%')).toBeInTheDocument()

    expect(screen.getByText('0 ms')).toBeInTheDocument()

    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })

  it('changes incident icon accent color to red when there are incidents', () => {
    const mockMonitors = [
      {
        id: '1',
        lastStatus: MonitorStatus.down,
        weekUptime: '100',
        trend: { avgResponseTime: 100 },
      },
    ]

    vi.mocked(useMonitors).mockReturnValue({
      isPending: false,
      data: { monitors: mockMonitors },
    } as any)

    render(<StatsCards />)

    const alertIcon = screen.getByTestId('icon-alert')
    const iconContainer = alertIcon.parentElement

    expect(iconContainer).toHaveStyle({
      background: '#f4433614',
      border: '1px solid #f4433622',
    })
    expect(alertIcon).toHaveAttribute('color', '#f44336')
  })
})
