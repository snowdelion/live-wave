import { AlertCircle } from 'lucide-react'

export function MonitorDetailsChartError({
  mode,
  periodDays,
}: {
  mode: 'uptime' | 'latency'
  periodDays: number
}) {
  const isUptimeMode = mode === 'uptime'
  const title = isUptimeMode ? 'UPTIME %' : 'LATENCY TIME'
  const description = isUptimeMode
    ? `Uptime over ${periodDays}d`
    : `Average response & Percentile 95th over ${periodDays}d`

  return (
    <div className="bg-[#0d120d] border border-[rgba(244,67,54,0.2)] rounded-lg pt-5 px-5 pb-3 h-70.75 sm:h-76.5">
      <div className="mb-4 ml-3">
        <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
          {title}
        </span>
        <p className="font-barlow font-bold text-[1.1rem] text-[#e8f5e8] mt-[0.15rem]">
          {description}
        </p>
      </div>
      <div className="relative h-45 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={32} className="text-[#f44336]" />
          <div className="text-center">
            <p className="font-jet-brains text-[0.75rem] text-[#f44336] mb-1">
              Failed to load uptime data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
