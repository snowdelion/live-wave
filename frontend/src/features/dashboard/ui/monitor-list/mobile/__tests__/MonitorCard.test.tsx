import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import type { UserMonitor } from '@/entities/monitor'

import { MonitorCard } from '../MonitorCard'

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
      Icon: (props: any) => <svg data-testid="type-icon" {...props} />,
    },
  },
}))

vi.mock('lucide-react', () => ({
  Eye: (props: any) => <svg data-testid="eye-icon" {...props} />,
  Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
  Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
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
    sparkline: [],
  },
  weekUptime: 99.9,
} as unknown as UserMonitor

describe('MonitorCard', () => {
  const onEdit = vi.fn()
  const setDeleteTarget = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders monitor details correctly when status is up', () => {
    render(<MonitorCard monitor={mockMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    expect(screen.getByText('Test Monitor')).toBeInTheDocument()
    expect(screen.getByText('test.com')).toBeInTheDocument()
    expect(screen.getByText('HTTP')).toBeInTheDocument()
    expect(screen.getByText('up')).toBeInTheDocument()
    expect(screen.getByText('120ms')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('5s ago')).toBeInTheDocument()

    const viewLink = screen.getByLabelText('View details')
    expect(viewLink).toHaveAttribute('href', '/dashboard/1')

    const card = screen.getByText('Test Monitor').closest('div.bg-\\[\\#0d120d\\]')
    expect(card).not.toHaveClass('bg-[rgba(244,67,54,0.04)]')
  })

  it('applies down status styles when lastStatus is down', () => {
    const downMonitor = { ...mockMonitor, lastStatus: 'down' } as UserMonitor
    render(<MonitorCard monitor={downMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const card = screen.getByText('Test Monitor').closest('div.bg-\\[\\#0d120d\\]')
    expect(card).toHaveClass('border-[rgba(244,67,54,0.3)]')
    expect(card).toHaveClass('bg-[rgba(244,67,54,0.04)]')

    const statusBadge = screen.getByText('down').closest('span')
    expect(statusBadge).toHaveClass('bg-[rgba(244,67,54,0.15)]')
    expect(statusBadge).toHaveClass('text-[#f44336]')
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<MonitorCard monitor={mockMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const editButton = screen.getByLabelText('Edit')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(mockMonitor)
  })

  it('calls setDeleteTarget when delete button is clicked', () => {
    render(<MonitorCard monitor={mockMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const deleteButton = screen.getByLabelText('Delete')
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
    render(<MonitorCard monitor={emptyMonitor} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />)

    const fallbacks = screen.getAllByText('-')
    expect(fallbacks.length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText('0s ago')).toBeInTheDocument()
  })
})
