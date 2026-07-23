import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MonitorType } from '@/entities/monitor'

import { FilterSelectMobile } from '../FilterSelectMobile'

vi.mock('lucide-react', () => ({
  Check: (props: any) => <svg data-testid="check-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
}))

describe('FilterSelectMobile', () => {
  const mockOnChange = vi.fn()
  const options = ['ALL', MonitorType.HTTP, MonitorType.TCP, MonitorType.ICMP, MonitorType.DNS] as (
    | MonitorType
    | 'ALL'
  )[]

  it('renders the button with the current selected value and chevron icon', () => {
    render(
      <FilterSelectMobile value={MonitorType.HTTP} options={options} onChange={mockOnChange} />,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent(MonitorType.HTTP)
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()
  })

  it('falls back to the first option if the value is not in the options array', () => {
    render(
      <FilterSelectMobile
        value={'INVALID' as unknown as MonitorType}
        options={options}
        onChange={mockOnChange}
      />,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('ALL')
  })

  it('opens the listbox and displays all options when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<FilterSelectMobile value="ALL" options={options} onChange={mockOnChange} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    expect(screen.getByRole('option', { name: 'ALL' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: MonitorType.HTTP })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: MonitorType.TCP })).toBeInTheDocument()
  })

  it('calls onChange with the new value when an option is selected', async () => {
    const user = userEvent.setup()
    render(<FilterSelectMobile value="ALL" options={options} onChange={mockOnChange} />)

    const button = screen.getByRole('button')
    await user.click(button)

    const httpOption = screen.getByRole('option', { name: MonitorType.HTTP })
    await user.click(httpOption)

    expect(mockOnChange).toHaveBeenCalledWith(MonitorType.HTTP)
  })

  it('displays the Check icon and applies selected styling to the active option', async () => {
    const user = userEvent.setup()
    render(<FilterSelectMobile value={MonitorType.TCP} options={options} onChange={mockOnChange} />)

    const button = screen.getByRole('button')
    await user.click(button)

    const selectedOption = screen.getByRole('option', { selected: true })

    const checkIcon = within(selectedOption).getByTestId('check-icon')
    expect(checkIcon).toBeInTheDocument()

    const selectedText = within(selectedOption).getByText(MonitorType.TCP)
    expect(selectedText.className).toContain('font-semibold')
    expect(selectedText.className).toContain('text-[#00e676]')
  })
})
