import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useHero } from '../model/useHero'

export function Hero() {
  const { canvasRef, uptimeBars, uptimePercentage, dotsCoords, shouldShowDots } = useHero()

  return (
    <section className="bg-[#080a08] min-h-dvh flex flex-col items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 
          bg-[linear-gradient(rgba(0,230,118,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,230,118,0.07)_1px,transparent_1px)] 
          bg-size-[40px_40px]"
      />

      <div
        className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-175 h-175
          bg-[radial-gradient(ellipse,rgba(0,230,118,0.07)_0%,transparent_70%)]"
      />

      <div
        className={`absolute top-[10%] right-[5%] w-70 h-40 transition-opacity duration-2000 ${shouldShowDots ? 'opacity-50' : 'opacity-0'}`}
      >
        {shouldShowDots &&
          dotsCoords.map((dot, i) => (
            <div
              key={i}
              className={`absolute`}
              style={{
                left: dot?.left,
                top: dot?.top,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] relative">
                <div
                  className="absolute -inset-1 rounded-full border border-[#00e676] animate-[ping_2s_ease-in-out_infinite] opacity-0"
                  style={{ animationDelay: dot?.delay }}
                />
              </div>
            </div>
          ))}
      </div>

      <div className="relative z-10 max-w-215 text-center">
        <div className="inline-flex items-center gap-2 bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.2)] rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
          <span className="font-jet-brains text-xs text-[#00e676] tracking-[0.08em]">
            Real-time monitoring
          </span>
        </div>

        <h1 className="font-barlow font-extrabold text-balance text-[clamp(3.5rem,9vw,6.5rem)] leading-none tracking-[-0.01em] text-[#e8f5e8] mb-6">
          <span>
            MONITOR YOUR SERVICES IN{' '}
            <span className="whitespace-nowrap text-[#00e676]">REAL TIME</span>
          </span>
          <br />
          <span className="text-[#e8f5e8]">
            KNOW BEFORE YOUR <span className="whitespace-nowrap">USERS DO</span>
          </span>
        </h1>

        <p className="font-inter text-[1.1rem] text-[#4caf50] max-w-135 mx-auto mb-10 leading-relaxed">
          <span className="font-bold tracking-wide">LiveWave</span> monitors your websites, APIs,
          and services at least every 1 minute. Get alerted before your customers notice
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-inter font-semibold text-[0.95rem] text-[#080a08] bg-[#00e676] px-7 py-3.5 rounded-lg transition-opacity hover:opacity-90 active:opacity-80"
        >
          Start monitoring
          <ArrowRight size={16} />
        </Link>

        <div className="mt-6 flex flex-col items-center sm:flex-row justify-center gap-6">
          {['Completely free', '1-minute check intervals', 'Cancel anytime'].map(text => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 font-inter text-sm text-[#4caf50]"
            >
              <CheckCircle2 size={13} color="#00e676" />
              {text}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-215 mt-16 border border-[rgba(0,230,118,0.12)] rounded-lg bg-[#0d120d] overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(0,230,118,0.08)]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1b2e1b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1b2e1b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1b2e1b]" />
          </div>
          <span className="font-jet-brains text-[0.72rem] text-[#4caf50]">Response time (ms)</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]" />
            <span className="font-jet-brains text-[0.72rem] text-[#00e676]">LIVE</span>
          </div>
        </div>
        <canvas ref={canvasRef} className="w-full h-30 block" />
      </div>

      <div className="relative z-10 w-full max-w-215 mt-4 border border-[rgba(0,230,118,0.12)] rounded-lg bg-[#0d120d] px-5 py-4">
        <div className="flex justify-between mb-2">
          <span className="font-jet-brains text-[0.72rem] text-[#4caf50]">30-day uptime</span>
          <span
            className={`font-jet-brains text-[0.72rem] text-[#00e676] transition-opacity duration-500 ${uptimePercentage ? 'opacity-100' : 'opacity-0'}`}
          >
            {uptimePercentage && `${uptimePercentage}%`}
          </span>
        </div>
        <div
          className={`flex gap-0.5 items-end h-7 transition-opacity duration-500 ${uptimeBars.length > 0 ? 'opacity-100' : 'opacity-0'}`}
        >
          {uptimeBars.map(bar => (
            <div
              key={bar.id}
              title={bar.ok ? '100% uptime' : 'Incident'}
              className={`flex-1 rounded-xs transition-opacity cursor-default ${bar.ok ? 'bg-[#00e676] opacity-70' : 'bg-[#f44336] opacity-90'}`}
              style={{ height: `${bar.height}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-jet-brains text-[0.65rem] text-[#1b5e20]">30 days ago</span>
          <span className="font-jet-brains text-[0.65rem] text-[#1b5e20]">Today</span>
        </div>
      </div>

      <p className="text-[0.6rem] text-[#4caf50]/50">*For illustration only</p>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  )
}
