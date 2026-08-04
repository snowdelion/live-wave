import { screen } from '@testing-library/react'

import { useOverview, useIncidents } from '@/entities/analytics'
import { MonitorType, useDetailedMonitor } from '@/entities/monitors'
import { renderWithClient } from '@/shared/test-utils'

import { getCardsData } from '../../lib/monitor-details.utils'

import { OverviewCards } from './OverviewCards'

vi.mock('@/entities/analytics', () => ({
  useOverview: vi.fn(),
  useIncidents: vi.fn(),
}))

vi.mock('@/entities/monitors', async () => {
  const actual = await vi.importActual('@/entities/monitors')
  return { ...actual, useDetailedMonitor: vi.fn() }
})

vi.mock('../../lib/monitor-details.utils', () => ({
  getCardsData: vi.fn(),
}))

vi.mock('./OverviewCardsSkeleton', () => ({
  OverviewCardsSkeleton: () => <div data-testid="skeleton">Loading cards...</div>,
}))

vi.mock('./OverviewCardsError', () => ({
  OverviewCardsError: () => <div data-testid="error">Error loading cards</div>,
}))

describe('OverviewCards', () => {
  const monitorId = 'mon-123'
  const periodDays = 7

  const mockMonitorData = {
    type: MonitorType.HTTP,
    domain: 'example.com',
  }

  const mockOverviewData = {
    uptime: 99.9,
    averageResponseTime: 120,
    up: 95,
    down: 5,
    totalChecks: 100,
  }

  const mockIncidentsData = {
    total: 3,
  }

  const mockCardsData = [
    {
      label: 'Uptime',
      value: '99.9%',
      sub: '7-day average',
      color: '#00e676',
      icon: (props: any) => <svg data-testid="icon-uptime" {...props} />,
    },
    {
      label: 'Avg Response',
      value: '120ms',
      sub: 'Average time',
      color: '#00e676',
      icon: (props: any) => <svg data-testid="icon-response" {...props} />,
    },
    {
      label: 'Total Checks',
      value: '100',
      sub: 'In period',
      color: '#00e676',
      icon: (props: any) => <svg data-testid="icon-checks" {...props} />,
    },
    {
      label: 'Incidents',
      value: '3',
      sub: 'Total incidents',
      color: '#f44336',
      icon: (props: any) => <svg data-testid="icon-incidents" {...props} />,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading states', () => {
    it('renders skeleton when monitor is pending', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: true,
        isError: false,
        data: undefined,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockOverviewData,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockIncidentsData,
      } as any)

      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders skeleton when overview is pending', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockMonitorData,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: true,
        isError: false,
        data: undefined,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockIncidentsData,
      } as any)

      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders skeleton when incidents are pending', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockMonitorData,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockOverviewData,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: true,
        isError: false,
        data: undefined,
      } as any)

      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })
  })

  describe('error states', () => {
    it('renders error component when monitor has an error', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: true,
        data: undefined,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockOverviewData,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockIncidentsData,
      } as any)

      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    it('renders error component when overview has an error', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockMonitorData,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: false,
        isError: true,
        data: undefined,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockIncidentsData,
      } as any)

      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    it('renders error component when incidents have an error', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockMonitorData,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockOverviewData,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        isError: true,
        data: undefined,
      } as any)

      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    beforeEach(() => {
      vi.mocked(useDetailedMonitor).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockMonitorData,
      } as any)
      vi.mocked(useOverview).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockOverviewData,
      } as any)
      vi.mocked(useIncidents).mockReturnValue({
        isPending: false,
        isError: false,
        data: mockIncidentsData,
      } as any)
      vi.mocked(getCardsData).mockReturnValue(mockCardsData as any)
    })

    it('calls getCardsData with the correct extracted data from hooks', () => {
      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)

      expect(getCardsData).toHaveBeenCalledWith({
        avgUptime: 99.9,
        avgResp: 120,
        totalChecks: 100,
        totalIncidents: 3,
        up: 95,
        down: 5,
        type: MonitorType.HTTP,
      })
    })

    it('renders all cards with correct labels, values, and subtexts', () => {
      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)

      expect(screen.getByText('Uptime')).toBeInTheDocument()
      expect(screen.getByText('99.9%')).toBeInTheDocument()
      expect(screen.getByText('7-day average')).toBeInTheDocument()

      expect(screen.getByText('Avg Response')).toBeInTheDocument()
      expect(screen.getByText('120ms')).toBeInTheDocument()
      expect(screen.getByText('Average time')).toBeInTheDocument()

      expect(screen.getByText('Total Checks')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('In period')).toBeInTheDocument()

      expect(screen.getByText('Incidents')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Total incidents')).toBeInTheDocument()
    })

    it('applies the correct color to each card value', () => {
      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)

      const uptimeValue = screen.getByText('99.9%')
      expect(uptimeValue).toHaveStyle({ color: '#00e676' })

      const incidentsValue = screen.getByText('3')
      expect(incidentsValue).toHaveStyle({ color: '#f44336' })
    })

    it('applies the correct background and border styles to icon containers', () => {
      renderWithClient(<OverviewCards monitorId={monitorId} periodDays={periodDays} />)

      const iconContainer = screen.getByTestId('icon-uptime').parentElement
      expect(iconContainer).toHaveStyle({
        background: '#00e67614',
        border: '1px solid #00e67622',
      })
    })
  })
})
