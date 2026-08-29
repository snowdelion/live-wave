'use client'
import { useUptimeBars } from '../../model/useUptimeBars'

export function UptimeChart() {
  const { uptimeBars, uptimePercentage } = useUptimeBars()

  return (
    <div className="relative z-10 w-full max-w-215 mt-4 border border-[rgba(0,230,118,0.12)] rounded-lg bg-[#0d120d] px-5 py-4">
      <div className="flex justify-between mb-2">
        <span className="font-jet-brains text-[0.72rem] text-[#4caf50]">30-day uptime</span>
        <span
          className={`font-jet-brains text-[0.72rem] text-[#00e676] transition-opacity duration-500 ${
            uptimePercentage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {uptimePercentage && `${uptimePercentage}%`}
        </span>
      </div>

      <div
        className={`flex gap-0.5 items-end h-7 transition-opacity duration-500 ${
          uptimeBars.length > 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {uptimeBars.map(bar => (
          <div
            key={bar.id}
            title={bar.ok ? '100% uptime' : 'Incident'}
            className={`flex-1 rounded-xs cursor-default ${
              bar.ok ? 'bg-[#00e676] opacity-70' : 'bg-[#f44336] opacity-90'
            }`}
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between mt-1">
        <span className="font-jet-brains text-[0.65rem] text-[#1b5e20]">30 days ago</span>
        <span className="font-jet-brains text-[0.65rem] text-[#1b5e20]">Today</span>
      </div>
    </div>
  )
}
