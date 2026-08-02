import { AlertTriangle } from 'lucide-react'

export function IncidentsSkeleton() {
  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg overflow-hidden mb-6">
      <div className="gap-[0.6rem] py-4 px-5 border-b border-b-[rgba(0,230,118,0.07)] bg-[#080a08] flex items-center">
        <AlertTriangle size={15} color="#ffd740" />
        <span className="text-sm sm:text-base font-barlow font-bold text-[#e8f5e8] tracking-[0.04em]">
          RECENT INCIDENTS
        </span>
        <div className="h-5 w-6 bg-[rgba(244,67,54,0.15)] rounded-full animate-pulse" />
      </div>

      <div className="divide-y divide-[rgba(0,230,118,0.05)]">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto] h-20 sm:h-17 items-center py-[0.9rem] px-5 gap-4"
          >
            <div className="min-w-0">
              <div className="h-3.5 w-20 sm:w-48 bg-[rgba(0,230,118,0.1)] rounded animate-pulse mb-1.5" />
              <div className="hidden sm:block h-3 w-40 bg-[rgba(0,230,118,0.05)] rounded animate-pulse" />
              <div className="flex flex-col sm:hidden gap-1">
                <div className="h-2.5 w-16 sm:w-24 bg-[rgba(0,230,118,0.05)] rounded animate-pulse" />
                <div className="h-2.5 w-10 sm:w-16 bg-[rgba(0,230,118,0.05)] rounded animate-pulse" />
              </div>
            </div>

            <div className="h-3 w-10 sm:w-16 bg-[rgba(0,230,118,0.08)] rounded animate-pulse" />

            <div className="h-5 w-16 sm:w-20 bg-[rgba(0,230,118,0.1)] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
