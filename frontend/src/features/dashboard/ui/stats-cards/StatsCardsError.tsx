import { AlertTriangle, Gauge, MonitorIcon, TrendingUp } from 'lucide-react'

export function StatsCardsError() {
  const cards = [
    { icon: MonitorIcon, label: 'Monitors' },
    { icon: TrendingUp, label: 'Uptime' },
    { icon: AlertTriangle, label: 'Incidents' },
    { icon: Gauge, label: 'Latency' },
  ]

  return (
    <div className="grid gap-4 mb-6 grid-cols-2 md:grid-cols-4">
      {cards.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="bg-[#0d120d] border border-[rgba(244,67,54,0.2)] h-36 rounded-lg py-3 sm:py-5 px-6 flex flex-col gap-2.5 sm:gap-2.75 lg:gap-2.5"
        >
          <div className="flex flex-col-reverse gap-2 sm:gap-0 sm:flex-row items-center justify-between">
            <span className="font-inter text-[0.65rem] sm:text-[0.78rem] text-[#f44336] text-center sm:text-start">
              {label}
            </span>

            <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md flex items-center justify-center bg-[rgba(244,67,54,0.08)] border border-[rgba(244,67,54,0.2)]">
              <Icon size={14} color="#f44336" />
            </div>
          </div>

          <span className="font-barlow font-extrabold text-xl sm:text-2xl lg:text-3xl text-[#f44336] text-center sm:text-start">
            -
          </span>

          <span className="font-jet-brains text-[0.6rem] sm:text-[0.68rem] text-[#f44336] text-center sm:text-start tracking-wider">
            Failed to load
          </span>
        </div>
      ))}
    </div>
  )
}
