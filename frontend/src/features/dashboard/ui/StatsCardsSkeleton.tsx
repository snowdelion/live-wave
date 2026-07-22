export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 mb-6 grid-cols-2 sm:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="bg-[#0d120d] items-center sm:items-start border border-[rgba(0,230,118,0.1)] h-36 rounded-lg py-3 sm:py-5 px-6 flex flex-col gap-2 animate-pulse"
        >
          <div className="flex flex-col-reverse sm:flex-row gap-2 items-center justify-between w-full">
            <div className="h-3 sm:h-4 w-18 bg-[#2e7d32]/30 rounded" />
            <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md bg-[#2e7d32]/30" />
          </div>

          <div className="h-8 w-14 bg-[#2e7d32]/30 rounded mb-2" />

          <div className="h-3 w-22 bg-[#2e7d32]/30 rounded" />
        </div>
      ))}
    </div>
  )
}
