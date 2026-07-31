import { useDetailedMonitor } from '@/entities/monitor'

import { PeriodSwitcherError } from './PeriodSwitcherError'
import { PeriodSwitcherSkeleton } from './PeriodSwitcherSkeleton'

export function PeriodSwitcher({ monitorId, periodDays, setPeriodDays }: PeriodSwitcherProps) {
  const { data: monitor, isPending, error } = useDetailedMonitor(monitorId)

  if (isPending)
    return <PeriodSwitcherSkeleton setPeriodDays={setPeriodDays} periodDays={periodDays} />
  if (error) return <PeriodSwitcherError />

  return (
    <section className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div className="h-16 sm:h-17.5">
        <h1 className="font-barlow font-extrabold text-[1.75rem] text-[#e8f5e8] tracking-[0.02em] mb-[0.15rem]">
          MONITOR DETAILS
        </h1>

        <span className="font-jet-brains text-[0.68rem] text-[#2e7d32] tracking-[0.08em]">
          {monitor.domain}
        </span>
      </div>
      <div className="inline-flex bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-md overflow-hidden">
        {[3, 7, 30].map(p => (
          <button
            key={p}
            onClick={() => setPeriodDays(p)}
            className={`font-jet-brains text-[0.72rem] tracking-[0.06em] py-[0.45rem] px-4 border-none transition-all duration-300 focus:outline-none ${periodDays === p ? 'bg-[#00e676] text-[#080a08] font-semibold' : 'bg-transparent text-[#4caf50] font-normal'}`}
          >
            {p}d
          </button>
        ))}
      </div>
    </section>
  )
}

interface PeriodSwitcherProps {
  monitorId: string
  periodDays: number
  setPeriodDays: (value: number) => void
}
