import { Globe, Bell, BarChart2, Shield, Zap, Code2 } from 'lucide-react'
import { useInView } from '../model/useInView'

export function Features() {
  const { ref, isInView } = useInView()

  return (
    <section ref={ref} id="features" className="relative bg-[#080a08] py-24 px-6">
      <div
        className={`absolute inset-0 z-10 bg-[#080a08] transition-opacity duration-1000 pointer-events-none ${isInView ? 'opacity-0' : 'opacity-100'}`}
      />
      <div className="absolute z-15 top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[rgba(0,230,118,0.3)] to-transparent" />

      <div className="max-w-275 m-auto">
        <div className="text-center mb-16">
          <span className="font-jet-brains text-[0.72rem] text-[#00e676] tracking-[0.15rem] block mr-4">
            FEATURES
          </span>
          <h2 className="font-barlow font-extrabold text-[clamp(2.5rem,6vw,4rem)] text-[#e8f5e8] leading-[1.05] tracking-[-0.01em]">
            EVERYTHING <span className="whitespace-nowrap">YOU NEED</span>
            <br />
            TO MONITOR YOUR SERVICES
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border border-[rgb(0,230,118)]/10 bg-[rgba(0,230,118,0.07)] rounded-lg overflow-hidden">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="bg-[#0d120d] p-8 transition-colors duration-200 hover:bg-[#111811]"
              >
                <div className="w-10 h-10 rounded-md bg-[rgba(0,230,118,0.1)] border border-[rgba(0,230,118,0.15)] flex items-center justify-center mb-5">
                  <Icon size={18} color="#00e676" />
                </div>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="font-jet-brains text-[1.4rem] font-medium text-[#00e676]">
                    {f.stat}
                  </span>
                  <span className="font-jet-brains text-[0.7rem] text-[#2e7d32] tracking-[0.08em]">
                    {f.statLabel}
                  </span>
                </div>

                <h3 className="font-barlow font-bold text-[1.2rem] text-[#e8f5e8] tracking-[0.02em] mb-[0.6rem]">
                  {f.title}
                </h3>

                <p className="font-inter text-sm text-[#4caf50] leading-[1.65]">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: Globe,
    title: '4 Types of Monitoring',
    desc: 'HTTP, TCP, ICMP, and DNS checks. Choose the right protocol for your service - from web apps to infrastructure',
    stat: '4',
    statLabel: 'protocols',
  },
  {
    icon: Zap,
    title: '1-Minute Check Intervals',
    desc: 'Monitoring checks selectively at least every minute. Get alerted quickly without overloading your servers',
    stat: '1m+',
    statLabel: 'fastest check',
  },
  {
    icon: Bell,
    title: 'Telegram Notifications',
    desc: 'Receive alerts instantly when your service goes down or recovers. Stay informed wherever you are',
    stat: 'INSTANT',
    statLabel: 'instant alert',
  },
  {
    icon: BarChart2,
    title: 'Response Time Trends & p95',
    desc: 'Track average and 95th percentile response times. See degradation before it becomes an outage',
    stat: 'p95',
    statLabel: 'percentile',
  },
  {
    icon: Shield,
    title: '30-Day Uptime History',
    desc: 'Monitor your service health over time. View daily uptime, incidents, and historical performance',
    stat: '30d',
    statLabel: 'history',
  },
  {
    icon: Code2,
    title: 'Incident Timeline & Error Insights',
    desc: 'Every downtime is logged with exact start/end times, duration, and error details. Understand what went wrong',
    stat: 'DETAILED',
    statLabel: 'error logs',
  },
]
