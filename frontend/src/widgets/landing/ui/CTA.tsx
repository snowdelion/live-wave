import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { useInView } from '../model/useInView'

export function CTA() {
  const { ref, isInView } = useInView()

  return (
    <section ref={ref} className="relative bg-[#080a08] py-28 px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[rgba(0,230,118,0.3)] to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,230,118,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,230,118,0.07)_1px,transparent_1px)] bg-size-[40px_40px]" />

      <div
        className={`relative transition-opacity duration-1000 ${isInView ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-[radial-gradient(ellipse,rgba(0,230,118,0.1)_0%,transparent_70%)]" />

        <div className={`relative max-w-175 mx-auto text-center`}>
          <h2 className="font-barlow font-extrabold text-[clamp(3rem,8vw,5.5rem)] text-[#e8f5e8] leading-none tracking-[-0.01em] mb-6">
            READY TO MONITOR
            <br />
            IN <span className="text-[#00e676]">REAL TIME?</span>
          </h2>

          <p className="font-inter text-[1rem] text-[#4caf50] max-w-120 mx-auto mb-10 leading-relaxed">
            Set up your first monitor in under 60 seconds. No credit card required or authorization.
            Start monitoring now
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 font-inter font-semibold text-[1rem] text-[#080a08] bg-[#00e676] px-8 py-4 rounded-lg transition-opacity hover:opacity-90 active:opacity-80"
            >
              Start monitoring free
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
