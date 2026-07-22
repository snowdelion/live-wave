import { render, screen, fireEvent } from '@testing-library/react'

import { MonitorType, useMonitors } from '@/entities/monitor'

import { FiltersBar } from '../FiltersBar'

vi.mock('lucide-react', () => ({
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
}))

vi.mock('@/entities/monitor', async () => {
  const actual = await vi.importActual('@/entities/monitor')
  return { ...actual, useMonitors: vi.fn() }
})

describe('FiltersBar', () => {
  const mockOnSearch = vi.fn()
  const mockOnTypeFilter = vi.fn()

  const defaultProps = {
    search: '',
    onSearch: mockOnSearch,
    typeFilter: 'ALL' as const,
    onTypeFilter: mockOnTypeFilter,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMonitors).mockReturnValue({
      data: { monitors: [{ id: '1' }, { id: '2' }, { id: '3' }] },
    } as any)
  })

  it('renders the search input and all filter buttons', () => {
    render(<FiltersBar {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search monitors...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveValue('')

    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: MonitorType.HTTP })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: MonitorType.TCP })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: MonitorType.ICMP })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: MonitorType.DNS })).toBeInTheDocument()
  })

  it('displays the correct total monitor count', () => {
    render(<FiltersBar {...defaultProps} />)

    expect(screen.getByText('3 / 5 monitors')).toBeInTheDocument()
  })

  it('displays 0 count when monitors array is empty', () => {
    vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as any)
    render(<FiltersBar {...defaultProps} />)

    expect(screen.getByText('0 / 5 monitors')).toBeInTheDocument()
  })

  it('calls onSearch when typing in the input', () => {
    render(<FiltersBar {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search monitors...')
    fireEvent.change(searchInput, { target: { value: 'my-monitor' } })

    expect(mockOnSearch).toHaveBeenCalledWith('my-monitor')
  })

  it('shows the clear button only when search has a value and clears it on click', () => {
    const { rerender } = render(<FiltersBar {...defaultProps} search="" />)

    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()

    rerender(<FiltersBar {...defaultProps} search="test" />)

    const xIcon = screen.getByTestId('x-icon')
    expect(xIcon).toBeInTheDocument()

    const clearButton = xIcon.closest('button')
    fireEvent.click(clearButton!)

    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('calls onTypeFilter when a filter button is clicked', () => {
    render(<FiltersBar {...defaultProps} />)

    const httpButton = screen.getByRole('button', { name: MonitorType.HTTP })
    fireEvent.click(httpButton)

    expect(mockOnTypeFilter).toHaveBeenCalledWith(MonitorType.HTTP)
  })

  it('applies active styling to the selected filter button', () => {
    render(<FiltersBar {...defaultProps} typeFilter={MonitorType.TCP} />)

    const tcpButton = screen.getByRole('button', { name: MonitorType.TCP })
    const allButton = screen.getByRole('button', { name: 'ALL' })

    expect(tcpButton.className).toContain('border-[#00e676]')
    expect(tcpButton.className).toContain('text-[#00e676]')

    expect(allButton.className).toContain('border-[rgba(0,230,118,0.12)]')
    expect(allButton.className).toContain('text-[#4caf50]')
  })
})
