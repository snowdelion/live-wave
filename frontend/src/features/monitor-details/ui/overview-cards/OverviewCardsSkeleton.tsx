import { Activity, AlertTriangle, BarChart2, ShieldCheck } from 'lucide-react'

export function OverviewCardsSkeleton() {
  const cards = [
    { label: 'Uptime', icon: ShieldCheck },
    { label: 'Response', icon: BarChart2 },
    { label: 'Checks', icon: Activity },
    { label: 'Incidents', icon: AlertTriangle },
  ]

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
      {cards.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="bg-[#0d120d] flex flex-col gap-2 border border-[rgba(0,230,118,0.1)] rounded-lg py-5 px-5 sm:px-6 h-31.75 sm:h-34.5"
        >
          <div className="flex justify-between gap-1 items-center">
            <span className="font-inter text-xs lg:text-sm text-[#4caf50]">{label}</span>
            <div className="w-5.75 h-5.75 sm:w-7 sm:h-7 rounded-md flex shrink-0 items-center justify-center bg-[rgba(0,230,118,0.06)] border border-[rgba(0,230,118,0.1)]">
              <Icon size={13} color="#2e7d32" />
            </div>
          </div>
          <div className="h-7 sm:h-9 w-20 sm:w-28 bg-[rgba(0,230,118,0.1)] rounded animate-pulse" />
          <div className="h-3 w-24 sm:w-32 bg-[rgba(0,230,118,0.05)] rounded animate-pulse" />
        </div>
      ))}
    </section>
  )
}
