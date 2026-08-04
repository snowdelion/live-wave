import { useIncidents, useOverview } from '@/entities/analytics'
import { useDetailedMonitor } from '@/entities/monitors'

import { getCardsData } from '../../lib/monitor-details.utils'

import { OverviewCardsError } from './OverviewCardsError'
import { OverviewCardsSkeleton } from './OverviewCardsSkeleton'

export function OverviewCards({ monitorId, periodDays }: OverviewCardsProps) {
  const {
    data: monitor,
    isPending: isMonitorPending,
    isError: isMonitorError,
  } = useDetailedMonitor(monitorId)
  const {
    data: overview,
    isPending: isOverviewPending,
    isError: isOverviewError,
  } = useOverview(monitorId, periodDays)
  const {
    data: incidentsDetails,
    isPending: isIncidentsPending,
    isError: isIncidentsError,
  } = useIncidents(monitorId, periodDays)

  if (isOverviewPending || isIncidentsPending || isMonitorPending) return <OverviewCardsSkeleton />
  if (isOverviewError || isIncidentsError || isMonitorError) return <OverviewCardsError />

  const avgUptime = overview.uptime
  const avgResp = overview.averageResponseTime
  const up = overview.up
  const down = overview.down
  const totalChecks = overview.totalChecks
  const totalIncidents = incidentsDetails.total

  const cardsData = getCardsData({
    avgUptime,
    avgResp,
    totalChecks,
    totalIncidents,
    up,
    down,
    type: monitor.type,
  })

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
      {cardsData.map(({ icon: Icon, ...rest }) => {
        return (
          <div
            key={rest.label}
            className="bg-[#0d120d] flex flex-col gap-2 border border-[rgba(0,230,118,0.1)] rounded-lg py-5 px-5 sm:px-6"
          >
            <div className="flex justify-between gap-1 items-center">
              <span className="font-inter text-xs lg:text-sm text-[#4caf50]">{rest.label}</span>
              <div
                className="w-5.75 h-5.75 sm:w-7 sm:h-7 rounded-md flex shrink-0 items-center justify-center"
                style={{
                  background: `${rest.color}14`,
                  border: `1px solid ${rest.color}22`,
                }}
              >
                <Icon size={13} color={rest.color} />
              </div>
            </div>
            <div
              className="font-barlow text-center sm:text-start font-extrabold text-2xl sm:text-3xl"
              style={{
                color: rest.color,
              }}
            >
              {rest.value}
            </div>
            <span className="font-jet-brains text-center sm:text-start text-[0.6rem] sm:text-[0.65rem] text-[#2e7d32] tracking-[0.06em]">
              {rest.sub}
            </span>
          </div>
        )
      })}
    </section>
  )
}

interface OverviewCardsProps {
  monitorId: string
  periodDays: number
}
