import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useTimeline } from '@/entities/analytics'
import { useIsResizing } from '@/shared/lib'

import { MonitorDetailsChartError } from './MonitorDetailsChartError'
import { MonitorDetailsChartSkeleton } from './MonitorDetailsChartSkeleton'
import { MonitorDetailsTooltip } from './MonitorDetailsTooltip'

interface UptimeChartProps {
  monitorId: string
  periodDays: number
}

export function UptimeChart({ monitorId, periodDays }: UptimeChartProps) {
  const { data: timeline, isPending, error } = useTimeline(monitorId, periodDays)
  const isResizing = useIsResizing()

  if (isPending || isResizing)
    return <MonitorDetailsChartSkeleton periodDays={periodDays} mode="uptime" />
  if (error) return <MonitorDetailsChartError periodDays={periodDays} mode="uptime" />

  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg pt-5 px-5 pb-3 chart-no-focus">
      <div className="mb-4 ml-3">
        <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
          UPTIME %
        </span>
        <p className="font-barlow font-bold text-[1.1rem] text-[#e8f5e8] mt-[0.15rem]">
          Uptime over {periodDays}d
        </p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(0,230,118,0.2)" strokeDasharray="8 8" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis
            domain={[Math.max(0, Math.floor(Math.min(...timeline.map(d => d.uptime)) - 2)), 100]}
            tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: '#2e7d32' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />

          <Tooltip
            content={<MonitorDetailsTooltip mode="uptime" />}
            cursor={{ stroke: 'rgba(0,230,118,0.3)', strokeDasharray: '10 10' }}
            animationDuration={0}
          />

          <Area
            type="monotone"
            dataKey="uptime"
            name="Uptime"
            stroke="#00e676"
            strokeWidth={2}
            fill="url(#ug)"
            dot={false}
            activeDot={{ r: 3, fill: '#00e676', stroke: '#0d120d', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
