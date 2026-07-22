export function MonitorTableMobileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] h-64.75 rounded-lg p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[rgba(0,230,118,0.08)] shrink-0" />
                <div className="h-5 w-32 bg-[rgba(0,230,118,0.08)] rounded" />
              </div>
              <div className="h-3 w-24 bg-[rgba(0,230,118,0.06)] rounded mt-1" />
            </div>
            <div className="w-12 h-7 bg-[rgba(0,230,118,0.08)] rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="h-3 w-12 bg-[rgba(0,230,118,0.06)] rounded" />
                <div className="h-4 w-20 bg-[rgba(0,230,118,0.08)] rounded mt-1" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[rgba(0,230,118,0.06)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-9 h-9 rounded-md bg-[rgba(0,230,118,0.08)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
