import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Navbar } from './Navbar'

// --- mocks ---
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('lucide-react', () => ({
  Activity: (props: Record<string, unknown>) => <svg data-testid="activity-icon" {...props} />,
}))

// --- tests ---
describe('Navbar', () => {
  it('renders the nav landmark', () => {
    render(<Navbar />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the LIVEWAVE brand link pointing to home', () => {
    render(<Navbar />)
    const brandLink = screen.getByRole('link', { name: /livewave/i })
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('renders the brand icon inside the brand link', () => {
    render(<Navbar />)
    const brandLink = screen.getByRole('link', { name: /livewave/i })
    expect(brandLink).toContainElement(screen.getByTestId('activity-icon'))
  })

  it('renders the "Get started" link pointing to /dashboard', () => {
    render(<Navbar />)
    const ctaLink = screen.getByRole('link', { name: /get started/i })
    expect(ctaLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders exactly two links', () => {
    render(<Navbar />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('renders the brand text as "LIVEWAVE"', () => {
    render(<Navbar />)
    expect(screen.getByText('LIVEWAVE')).toBeInTheDocument()
  })
})
