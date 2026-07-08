import { render, screen } from '@testing-library/react'

import LandingPage from './LandingPage'

vi.mock('@/widgets/landing', () => ({
  Hero: () => <div data-testid="hero">Hero</div>,
  Features: () => <div data-testid="features">Features</div>,
  CTA: () => <div data-testid="cta">CTA</div>,
  Footer: () => <div data-testid="footer">Footer</div>,
  LandingNavbar: () => <div data-testid="landing-navbar">Landing Navbar</div>,
}))

describe('LandingPage', () => {
  it('renders without crashing', () => {
    render(<LandingPage />)
  })

  it('renders the LandingNavbar', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('landing-navbar')).toBeInTheDocument()
  })

  it('renders the Hero section', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('hero')).toBeInTheDocument()
  })

  it('renders the Features section', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('features')).toBeInTheDocument()
  })

  it('renders the CTA section', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('cta')).toBeInTheDocument()
  })

  it('renders the Footer', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders all sections exactly once', () => {
    render(<LandingPage />)
    expect(screen.getAllByTestId('landing-navbar')).toHaveLength(1)
    expect(screen.getAllByTestId('hero')).toHaveLength(1)
    expect(screen.getAllByTestId('features')).toHaveLength(1)
    expect(screen.getAllByTestId('cta')).toHaveLength(1)
    expect(screen.getAllByTestId('footer')).toHaveLength(1)
  })

  it('renders sections in the correct order: LandingNavbar, Hero, Features, CTA, Footer', () => {
    const { container } = render(<LandingPage />)
    const ids = Array.from(container.querySelectorAll('[data-testid]')).map(el =>
      el.getAttribute('data-testid'),
    )
    expect(ids).toEqual(['landing-navbar', 'hero', 'features', 'cta', 'footer'])
  })
})
