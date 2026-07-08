import { render, screen } from '@testing-library/react'

import '@testing-library/jest-dom'
import { LandingNavbar } from './LandingNavbar'

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
describe('LandingLandingNavbar', () => {
  it('renders the nav landmark', () => {
    render(<LandingNavbar />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the LIVEWAVE brand link pointing to home', () => {
    render(<LandingNavbar />)
    const brandLink = screen.getByRole('link', { name: /livewave/i })
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('renders the brand icon inside the brand link', () => {
    render(<LandingNavbar />)
    const brandLink = screen.getByRole('link', { name: /livewave/i })
    expect(brandLink).toContainElement(screen.getByTestId('activity-icon'))
  })

  it('renders the "Get started" link pointing to /dashboard', () => {
    render(<LandingNavbar />)
    const ctaLink = screen.getByRole('link', { name: /get started/i })
    expect(ctaLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders exactly two links', () => {
    render(<LandingNavbar />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('renders the brand text as "LIVEWAVE"', () => {
    render(<LandingNavbar />)
    expect(screen.getByText('LIVEWAVE')).toBeInTheDocument()
  })
})
