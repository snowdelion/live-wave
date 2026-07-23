import { screen, fireEvent } from '@testing-library/react'

import { MonitorType, MONITOR_QUERY_KEYS } from '@/entities/monitor'
import { renderWithClient } from '@/shared/test-utils'

import { FiltersBar } from '../FiltersBar'

vi.mock('lucide-react', () => ({
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
  RotateCw: (props: any) => <svg data-testid="rotate-cw-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
}))

vi.mock('../FilterSelectMobile', () => ({
  FilterSelectMobile: () => <div data-testid="mobile-select-mock" />,
}))

const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

vi.mock('@/entities/monitor', async () => {
  const actual = await vi.importActual('@/entities/monitor')
  return { ...actual }
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
  })

  it('renders the search input, refresh button, and filter buttons', () => {
    renderWithClient(<FiltersBar {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search monitors...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveValue('')

    expect(screen.getByTestId('rotate-cw-icon')).toBeInTheDocument()

    expect(screen.getByText('ALL')).toBeInTheDocument()
    expect(screen.getByText(MonitorType.HTTP)).toBeInTheDocument()
    expect(screen.getByText(MonitorType.TCP)).toBeInTheDocument()
    expect(screen.getByText(MonitorType.ICMP)).toBeInTheDocument()
    expect(screen.getByText(MonitorType.DNS)).toBeInTheDocument()
  })

  it('calls invalidateQueries when refresh button is clicked', () => {
    renderWithClient(<FiltersBar {...defaultProps} />)

    const refreshButton = screen.getByTestId('rotate-cw-icon').closest('button')
    fireEvent.click(refreshButton!)

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: MONITOR_QUERY_KEYS.list(),
    })
  })

  it('calls onSearch when typing in the input', () => {
    renderWithClient(<FiltersBar {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search monitors...')
    fireEvent.change(searchInput, { target: { value: 'my-monitor' } })

    expect(mockOnSearch).toHaveBeenCalledWith('my-monitor')
  })

  it('shows the clear button only when search has a value and clears it on click', () => {
    const { rerender } = renderWithClient(<FiltersBar {...defaultProps} search="" />)

    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()

    rerender(<FiltersBar {...defaultProps} search="test" />)

    const xIcon = screen.getByTestId('x-icon')
    expect(xIcon).toBeInTheDocument()

    const clearButton = xIcon.closest('button')
    fireEvent.click(clearButton!)

    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('calls onTypeFilter when a desktop filter button is clicked', () => {
    renderWithClient(<FiltersBar {...defaultProps} />)

    const httpButton = screen.getByText(MonitorType.HTTP)
    fireEvent.click(httpButton)

    expect(mockOnTypeFilter).toHaveBeenCalledWith(MonitorType.HTTP)
  })

  it('applies active styling to the selected filter button', () => {
    renderWithClient(<FiltersBar {...defaultProps} typeFilter={MonitorType.TCP} />)

    const tcpButton = screen.getByText(MonitorType.TCP)
    const allButton = screen.getByText('ALL')

    expect(tcpButton.className).toContain('border-[#00e676]')
    expect(tcpButton.className).toContain('text-[#00e676]')
    expect(tcpButton.className).toContain('bg-[rgba(0,230,118,0.05)]')

    expect(allButton.className).toContain('border-[rgba(0,230,118,0.12)]')
    expect(allButton.className).toContain('text-[#4caf50]')
  })
})
