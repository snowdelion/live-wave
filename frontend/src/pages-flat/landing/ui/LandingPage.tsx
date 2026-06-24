'use client'
import { Features, Hero, CTA, Footer } from '@/widgets/landing'
import { Navbar } from '@/widgets/navbar'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </>
  )
}
