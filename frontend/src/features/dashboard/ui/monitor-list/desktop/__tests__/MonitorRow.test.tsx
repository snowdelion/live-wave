import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import type { UserMonitor } from '@/entities/monitor'

import { MonitorRow } from '../MonitorRow'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../../../../lib/dashboard.utils', () => ({
  formatTime: vi.fn(seconds => `${seconds}s ago`),
  getResponseColor: vi.fn(() => '#4caf50'),
  getUptimeColor: vi.fn(() => '#00e676'),
}))

vi.mock('../../../../lib/monitor.constants', () => ({
  TYPE_STYLE: {
    HTTP: {
      color: '#00e676',
      bg: 'rgba(0,230,118,0.1)',
      Icon: () => <span data-testid="type-icon">Http</span>,
    },
  },
}))

vi.mock('../../../shared/SparkLine', () => ({
  SparkLine: ({ data, color }: any) => (
    <div data-testid="sparkline" data-color={color}>
      {data?.length || 0}
    </div>
  ),
}))

vi.mock('lucide-react', () => ({
  Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
  Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
  Eye: (props: any) => <svg data-testid="eye-icon" {...props} />,
}))

const mockMonitor = {
  id: '1',
  name: 'Test Monitor',
  domain: 'test.com',
  type: 'HTTP',
  lastStatus: 'up',
  lastCheckedAt: new Date(Date.now() - 5000),
  trend: {
    avgResponseTime: 120,
    sparkline: [10, 20, 30],
  },
  weekUptime: 99.99,
} as unknown as UserMonitor

describe('MonitorRow', () => {
  const onEdit = vi.fn()
  const setDeleteTarget = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders monitor details correctly when status is up', () => {
    render(<MonitorRow monitor={mockMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    expect(screen.getByText('Test Monitor')).toBeInTheDocument()
    expect(screen.getByText('test.com')).toBeInTheDocument()
    expect(screen.getByText('HTTP')).toBeInTheDocument()
    expect(screen.getByText('up')).toBeInTheDocument()
    expect(screen.getByText('120ms')).toBeInTheDocument()
    expect(screen.getByText('99.99%')).toBeInTheDocument()
    expect(screen.getByText('5s ago')).toBeInTheDocument()

    const viewLink = screen.getByTitle('View details')
    expect(viewLink).toHaveAttribute('href', '/dashboard/1')

    const sparkline = screen.getByTestId('sparkline')
    expect(sparkline).toHaveAttribute('data-color', '#00e676')
  })

  it('applies down status styles and sparkline color when lastStatus is down', () => {
    const downMonitor = { ...mockMonitor, lastStatus: 'down' } as UserMonitor
    render(<MonitorRow monitor={downMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const row = screen.getByText('Test Monitor').closest('div.grid')
    expect(row).toHaveClass('bg-[rgba(244,67,54,0.04)]')
    expect(row).toHaveClass('border-l-[rgba(244,67,54,0.4)]')

    const sparkline = screen.getByTestId('sparkline')
    expect(sparkline).toHaveAttribute('data-color', '#f44336')
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<MonitorRow monitor={mockMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const editButton = screen.getByTitle('Edit')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(mockMonitor)
  })

  it('calls setDeleteTarget when delete button is clicked', () => {
    render(<MonitorRow monitor={mockMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const deleteButton = screen.getByTitle('Delete')
    fireEvent.click(deleteButton)

    expect(setDeleteTarget).toHaveBeenCalledTimes(1)
    expect(setDeleteTarget).toHaveBeenCalledWith(mockMonitor)
  })

  it('handles missing or invalid data gracefully with fallbacks', () => {
    const emptyMonitor = {
      ...mockMonitor,
      trend: { avgResponseTime: 0, sparkline: [] },
      weekUptime: NaN,
      lastCheckedAt: null,
    } as unknown as UserMonitor
    render(<MonitorRow monitor={emptyMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const fallbacks = screen.getAllByText('-')
    expect(fallbacks.length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText('0s ago')).toBeInTheDocument()
  })
})
