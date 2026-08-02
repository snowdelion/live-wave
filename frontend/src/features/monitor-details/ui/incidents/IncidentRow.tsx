import dayjs from 'dayjs'
import { Clock } from 'lucide-react'

import type { AnalyticsIncident, AnalyticsIncidents } from '@/entities/analytics'

export function IncidentRow({
  incident,
  onIncidentChange,
  incidentsDetails,
  index,
}: IncidentProps) {
  return (
    <div
      key={`${incident.startAt}-${incident.endAt}`}
      onClick={() => onIncidentChange(incident)}
      className={`grid grid-cols-[1fr_auto_auto] items-center py-[0.9rem] px-5 cursor-pointer transition duration-150 hover:bg-[rgba(0,230,118,0.02)] active:bg-[rgba(0,230,118,0.08)] ${incident.endAt === null ? '' : 'gap-4'} ${index < incidentsDetails.total - 1 ? 'border border-[rgba(0,230,118,0.05)]' : 'border-none'}`}
    >
      <div className="min-w-0">
        <p className="font-jet-brains text-xs sm:text-[0.78rem] text-[#e8f5e8] mb-[0.2rem] whitespace-nowrap overflow-hidden text-ellipsis">
          {incident.cause}
        </p>
        <p className="hidden sm:block font-inter sm:text-xs text-[#4caf50]">
          {`${dayjs(incident.startAt).format('DD MMM, YYYY')} • ${dayjs(incident.startAt).format('HH:mm:ss')}`}
        </p>
        <p className="flex flex-col sm:hidden font-inter text-[0.65rem] text-[#4caf50]">
          <span>{`${dayjs(incident.startAt).format('DD.MM.YYYY')}`}</span>
          <span>{`${dayjs(incident.startAt).format('HH:mm:ss')}`}</span>
        </p>
      </div>

      {incident.endAt && (
        <span className="inline-flex items-center gap-[0.2rem] sm:gap-[0.3rem] font-jet-brains text-[0.6rem] sm:text-[0.68rem] text-[#a5d6a7] whitespace-nowrap">
          <Clock size={11} />
          {incident.formattedDuration === 'Active' ? 'Active' : incident.formattedDuration}
        </span>
      )}
      <span
        className={`font-jet-brains text-[0.6rem] sm:text-[0.68rem] border rounded-full py-[0.2rem] px-1.5 sm:px-[0.6rem] whitespace-nowrap
                ${incident.status === 'Resolved' ? 'text-[#00e676] bg-[rgba(0,230,118,0.08)] border-[rgba(0,230,118,0.2)]' : 'text-[#f44336] bg-[rgba(244,67,54,0.08)] border-[rgba(244,67,54,0.2)]'}`}
      >
        {incident.status === 'Resolved' ? 'Resolved' : 'Active'}
      </span>
    </div>
  )
}

interface IncidentProps {
  incident: AnalyticsIncident
  onIncidentChange: (value: AnalyticsIncident) => void
  incidentsDetails: AnalyticsIncidents
  index: number
}
