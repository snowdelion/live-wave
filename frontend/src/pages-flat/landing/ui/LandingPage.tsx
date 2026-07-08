'use client'
import { Features, Hero, CTA, Footer, LandingNavbar } from '@/widgets/landing'

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </>
  )
}
