import { Activity, AlertTriangle, BarChart2, ShieldCheck } from 'lucide-react'

import type { MonitorType } from '@/entities/monitors'

import { RESPONSE_THRESHOLD } from './monitor-details.constants'

const uptimeColor = (v: number, thresholds: [number, number]) => {
  if (v >= thresholds[0]) return '#00e676'
  if (v >= thresholds[1]) return '#ffd740'
  return '#f44336'
}

const latencyColor = (v: number, thresholds: [number, number]) => {
  if (v <= thresholds[0]) return '#00e676'
  if (v <= thresholds[1]) return '#ffd740'
  return '#f44336'
}

interface GetCardsDataOptions {
  avgUptime: number
  avgResp: number | null
  totalChecks: number
  totalIncidents: number
  up: number
  down: number
  type: MonitorType
}

export const getCardsData = ({
  avgUptime,
  avgResp,
  totalChecks,
  totalIncidents,
  up,
  down,
  type,
}: GetCardsDataOptions) => {
  const threshold = RESPONSE_THRESHOLD[type]
  const responseColor =
    avgResp !== null ? latencyColor(avgResp, [threshold.good, threshold.warn]) : '#f44336'
  const responseSub =
    avgResp !== null
      ? avgResp < threshold.good
        ? 'Fast'
        : avgResp < threshold.warn
          ? 'Acceptable'
          : 'Slow'
      : 'No response'

  return [
    {
      icon: ShieldCheck,
      label: `Uptime`,
      value: `${avgUptime.toFixed(2)}%`,
      color: uptimeColor(avgUptime, [99.5, 98]),
      sub: avgUptime >= 99.5 ? 'Excellent' : avgUptime >= 98 ? 'Degraded' : 'Critical',
    },
    {
      icon: BarChart2,
      label: 'Response',
      value: avgResp !== null ? `${Math.round(avgResp)} ms` : '-',
      color: responseColor,
      sub: responseSub,
    },
    {
      icon: Activity,
      label: 'Checks',
      value: `${totalChecks}`,
      color: '#00e676',
      sub: `${up} up | ${down} down`,
    },
    {
      icon: AlertTriangle,
      label: `Incidents`,
      value: String(totalIncidents),
      color: totalIncidents === 0 ? '#00e676' : '#f44336',
      sub: totalIncidents === 0 ? 'No incidents' : `${totalIncidents} detected`,
    },
  ]
}
