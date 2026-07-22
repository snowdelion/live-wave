import { Monitor as MonitorIcon, TrendingUp, AlertTriangle, Gauge } from 'lucide-react'

import { MonitorStatus, useMonitors } from '@/entities/monitor'

import { StatsCardsSkeleton } from './StatsCardsSkeleton'

export function StatsCards() {
  const { data: { monitors } = { monitors: [] }, isPending } = useMonitors()

  if (isPending) return <StatsCardsSkeleton />

  const total = monitors.length
  const upCount = monitors.filter(m => m.lastStatus === MonitorStatus.up).length
  const downCount = monitors.filter(m => m.lastStatus === MonitorStatus.down).length
  const avgUptime =
    monitors.reduce(
      (acc, m) => acc + (!isNaN(Number(m.weekUptime)) ? Number(m.weekUptime) : 0),
      0,
    ) / monitors.length || 0

  const avgResponse =
    monitors.reduce(
      (acc, m) =>
        acc + (!isNaN(Number(m.trend.avgResponseTime)) ? Number(m.trend.avgResponseTime) : 0),
      0,
    ) / (monitors.filter(m => m.trend.avgResponseTime !== null).length || 1)

  return (
    <div className="grid gap-4 mb-6 grid-cols-2 md:grid-cols-4">
      {CARDS_STYLE(total, upCount, downCount, avgUptime, avgResponse).map(card => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-[#0d120d] bg-linear-to-br from-[#0d120d] to-[rgba(0,230,118,0.03)] border border-[rgba(0,230,118,0.1)] justify-center h-36 rounded-lg py-3 sm:py-5 px-6 flex flex-col gap-2"
          >
            <div className="flex flex-col-reverse gap-2 sm:gap-0 sm:flex-row items-center justify-between">
              <span className="font-inter text-[0.65rem] sm:text-[0.78rem] text-[#4caf50] text-center sm:text-start">
                {card.label}
              </span>

              <div
                className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md flex items-center justify-center"
                style={{
                  background: `${card.accent}14`,
                  border: `1px solid ${card.accent}22`,
                }}
              >
                <Icon size={14} color={card.accent} />
              </div>
            </div>

            <span className="font-barlow font-extrabold text-xl sm:text-3xl lg:text-[2rem] text-[#e8f5e8] text-center sm:text-start">
              {card.value}
            </span>

            <span className="font-jet-brains text-[0.6rem] sm:text-[0.68rem] text-[#2e7d32] text-center sm:text-start tracking-wider">
              {card.sub}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const CARDS_STYLE = (
  total: number,
  upCount: number,
  downCount: number,
  avgUptime: number,
  avgResponse: number,
) => [
  {
    icon: MonitorIcon,
    label: 'Monitors',
    value: total,
    sub: `${upCount} UP · ${downCount} DOWN`,
    accent: '#00e676',
  },
  {
    icon: TrendingUp,
    label: 'Uptime',
    value: `${Math.round(avgUptime)}%`,
    sub: '7-day average',
    accent: '#00e676',
  },
  {
    icon: AlertTriangle,
    label: 'Incidents',
    value: downCount,
    sub: 'In last 7 days',
    accent: downCount > 0 ? '#f44336' : '#00e676',
  },
  {
    icon: Gauge,
    label: 'Latency',
    value: `${Math.round(avgResponse)} ms`,
    sub: 'Average response',
    accent: '#00e676',
  },
]
