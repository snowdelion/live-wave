import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Info } from 'lucide-react'
import { Fragment } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  useTimeline,
  type AnalyticsTimelineItem,
  type AnalyticsTimelineItems,
} from '@/entities/analytics'
import { useIsResizing } from '@/shared/lib'

import { MonitorDetailsChartError } from './MonitorDetailsChartError'
import { MonitorDetailsChartSkeleton } from './MonitorDetailsChartSkeleton'
import { MonitorDetailsTooltip } from './MonitorDetailsTooltip'

export function LatencyChart({ monitorId, periodDays }: LatencyChartProps) {
  const { data: rawTimeline, isPending, error } = useTimeline(monitorId, periodDays)
  const isResizing = useIsResizing()

  if (isPending || isResizing)
    return <MonitorDetailsChartSkeleton periodDays={periodDays} mode="latency" />
  if (error) return <MonitorDetailsChartError periodDays={periodDays} mode="latency" />

  let timelineItems: AnalyticsTimelineItems = rawTimeline.items
  if (rawTimeline.items.length === 1) {
    const item = rawTimeline.items[0] as AnalyticsTimelineItem
    timelineItems = [item, { ...item, date: new Date() }]
  }

  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg pt-5 px-5 pb-3 chart-no-focus">
      <div className="mb-4 ml-3">
        <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
          LATENCY TIME
        </span>
        <p className="font-barlow font-bold text-[1.1rem] text-[#e8f5e8] mt-[0.15rem]">
          Average response & Percentile 95th over {periodDays}d
        </p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={timelineItems} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(0,230,118,0.2)" strokeDasharray="8 8" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: '#2e7d32' }}
            hide
          />

          <YAxis
            tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: '#2e7d32' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}`}
            width={35}
            domain={[0, 'auto']}
          />

          <Tooltip
            content={<MonitorDetailsTooltip mode="latency" />}
            cursor={{ stroke: 'rgba(0,230,118,0.3)', strokeDasharray: '10 10' }}
            animationDuration={0}
          />

          <Line
            type="monotone"
            dataKey="p95ResponseTime"
            name="P95 ms"
            stroke="#ffd740"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#ffd740', stroke: '#0d120d', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="averageResponseTime"
            name="Avg ms"
            stroke="#00e676"
            strokeWidth={2}
            fill="url(#rg)"
            dot={false}
            activeDot={{ r: 3, fill: '#00e676', stroke: '#0d120d', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-5 mt-2 ml-3">
        {[
          { color: '#00e676', label: 'Average response', tip: false },
          { color: '#ffd740', label: 'Percentile 95th', tip: true },
        ].map(({ label, color, tip }) => (
          <span
            key={label}
            className="inline-flex items-center gap-[0.35rem] font-jet-brains text-[0.65rem] text-[#1b5e20]"
          >
            <span className="w-4 h-0.5 rounded-xs shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface LatencyChartProps {
  monitorId: string
  periodDays: number
}
