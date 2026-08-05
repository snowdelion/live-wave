import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { useIncidents, type AnalyticsIncident } from '@/entities/analytics'

import { IncidentRow } from './IncidentRow'
import { IncidentsError } from './IncidentsError'
import { IncidentsSkeleton } from './IncidentsSkeleton'

export function Incidents({ monitorId, onIncidentChange, periodDays }: IncidentsProps) {
  const { data: incidentsDetails, isPending, error } = useIncidents(monitorId, periodDays)

  if (isPending) return <IncidentsSkeleton />
  if (error) return <IncidentsError />

  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg overflow-hidden mb-6">
      <div className="gap-[0.6rem] py-4 px-5 border-b border-b-[rgba(0,230,118,0.07)] bg-[#080a08] flex items-center">
        <AlertTriangle size={15} color="#ffd740" />
        <span className="text-sm sm:text-base font-barlow font-bold text-[#e8f5e8] tracking-[0.04em]">
          RECENT INCIDENTS
        </span>
        {incidentsDetails.total > 0 && (
          <span className="font-jet-brains text-[0.65rem] text-[#f44336] bg-[rgba(244,67,54,0.1)] border border-[rgba(244,67,54,0.2)] rounded-full py-[0.1rem] px-2">
            {incidentsDetails.total}
          </span>
        )}
      </div>

      {incidentsDetails.total === 0 ? (
        <div className="p-10 flex flex-col items-center justify-center gap-3">
          <CheckCircle2 size={32} strokeWidth={1.5} color="#4caf50" />
          <p className="font-inter text-[0.9rem] text-[#4caf50] text-center">
            No incidents in the last {periodDays} days
          </p>
        </div>
      ) : (
        incidentsDetails.incidents.map((incident, index) => (
          <IncidentRow
            key={incident.id}
            incident={incident}
            onIncidentChange={onIncidentChange}
            totalIncidents={incidentsDetails.total}
            index={index}
          />
        ))
      )}
    </div>
  )
}

interface IncidentsProps {
  monitorId: string
  onIncidentChange: (value: AnalyticsIncident) => void
  periodDays: number
}
