import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

import { HeroDots } from './HeroDots'
import { HeroResponseChart } from './HeroResponseChart'
import { UptimeChart } from './HeroUptimeChart'

const BENEFITS = ['Completely free', '5-minutes check intervals', 'Cancel anytime'] as const

export function Hero() {
  return (
    <section className="bg-[#080a08] min-h-dvh flex flex-col items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,230,118,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,230,118,0.07)_1px,transparent_1px)] bg-size-[40px_40px]" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-175 h-175 bg-[radial-gradient(ellipse,rgba(0,230,118,0.07)_0%,transparent_70%)]" />
      <HeroDots />

      <div className="relative z-10 max-w-215 text-center">
        <Badge />
        <Headline />
        <Description />
        <CtaButton />
        <BenefitsList />
      </div>

      <HeroResponseChart />
      <UptimeChart />

      <p className="text-[0.6rem] text-[#4caf50]/50">*For illustration only</p>
    </section>
  )
}

function Badge() {
  return (
    <div className="inline-flex items-center gap-2 bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.2)] rounded-full px-4 py-1.5 mb-8">
      <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] animate-pulse-dot" />
      <span className="font-jet-brains text-xs text-[#00e676] tracking-[0.08em]">
        Real-time monitoring
      </span>
    </div>
  )
}

function Headline() {
  return (
    <h1 className="font-barlow font-extrabold text-balance text-[clamp(3.5rem,9vw,6.5rem)] leading-none tracking-[-0.01em] text-[#e8f5e8] mb-6">
      <span>
        MONITOR YOUR SERVICES IN <span className="whitespace-nowrap text-[#00e676]">REAL TIME</span>
      </span>
      <br />
      <span className="text-[#e8f5e8]">
        KNOW BEFORE YOUR <span className="whitespace-nowrap">USERS DO</span>
      </span>
    </h1>
  )
}

function Description() {
  return (
    <p className="font-inter text-[1.1rem] text-[#4caf50] max-w-135 mx-auto mb-10 leading-relaxed">
      <span className="font-bold tracking-wide">LiveWave</span> monitors your websites, APIs, and
      services at least every 5 minutes. Get alerted before your customers notice
    </p>
  )
}

function CtaButton() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 font-inter font-semibold text-[0.95rem] text-[#080a08] bg-[#00e676] px-7 py-3.5 rounded-lg transition-opacity hover:opacity-90 active:opacity-80"
    >
      Start monitoring
      <ArrowRight size={16} />
    </Link>
  )
}

function BenefitsList() {
  return (
    <div className="mt-6 flex flex-col items-center sm:flex-row justify-center gap-6">
      {BENEFITS.map(text => (
        <span
          key={text}
          className="inline-flex items-center gap-1.5 font-inter text-sm text-[#4caf50]"
        >
          <CheckCircle2 size={13} color="#00e676" />
          {text}
        </span>
      ))}
    </div>
  )
}
