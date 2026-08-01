import { Activity, AlertTriangle, BarChart2, ShieldCheck } from 'lucide-react'

export function OverviewCardsError() {
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
          className="bg-[#0d120d] flex flex-col gap-2 border border-[rgba(244,67,54,0.15)] rounded-lg py-5 px-5 sm:px-6 h-31.75 sm:h-34.5"
        >
          <div className="flex justify-between gap-1 items-center">
            <span className="font-inter text-xs lg:text-sm text-[#f44336]">{label}</span>
            <div className="w-5.75 h-5.75 sm:w-7 sm:h-7 rounded-md flex shrink-0 items-center justify-center bg-[rgba(244,67,54,0.08)] border border-[rgba(244,67,54,0.2)]">
              <Icon size={13} color="#f44336" />
            </div>
          </div>
          <div className="font-barlow text-center sm:text-start font-extrabold text-2xl sm:text-3xl text-[#f44336]">
            -
          </div>
        </div>
      ))}
    </section>
  )
}
