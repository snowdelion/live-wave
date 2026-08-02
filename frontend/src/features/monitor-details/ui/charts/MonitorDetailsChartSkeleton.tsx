export function MonitorDetailsChartSkeleton({
  mode,
  periodDays,
}: {
  mode: 'uptime' | 'latency'
  periodDays: number
}) {
  const isUptimeMode = mode === 'uptime'
  const title = isUptimeMode ? 'UPTIME %' : 'LATENCY TIME'
  const description = isUptimeMode
    ? `Uptime over ${periodDays}d`
    : `Average response & Percentile 95th over ${periodDays}d`

  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg pt-5 pb-3 sm:px-5 h-70.75 sm:h-76.5">
      <div className="mb-4 ml-8 sm:ml-3">
        <span className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest">
          {title}
        </span>
        <p className="font-barlow font-bold text-[1.1rem] text-[#e8f5e8] mt-[0.15rem]">
          {description}
        </p>
      </div>

      <div className="relative mx-5 sm:mx-2">
        <div className="absolute inset-0 flex flex-col justify-between py-2 ml-10">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="border-t border-[rgba(0,230,118,0.08)] w-full" />
          ))}
        </div>

        <div className="absolute mx-2 right-0 top-0 bottom-0 sm:bottom-0 left-10 flex items-end">
          <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
            {isUptimeMode ? (
              <>
                <defs>
                  <linearGradient id="uptime-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,230,118,0.2)" />
                    <stop offset="100%" stopColor="rgba(0,230,118,0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,30 Q50,25 100,28 T200,20 T300,35 T400,25 L400,180 L0,180 Z"
                  fill="url(#uptime-gradient)"
                  className="animate-pulse"
                />
                <path
                  d="M0,30 Q50,25 100,28 T200,20 T300,35 T400,25"
                  fill="none"
                  stroke="rgba(0,230,118,0.4)"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </>
            ) : (
              <>
                <defs>
                  <linearGradient id="avg-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,230,118,0.15)" />
                    <stop offset="100%" stopColor="rgba(0,230,118,0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,120 Q50,100 100,110 T200,90 T300,100 T400,80 L400,180 L0,180 Z"
                  fill="url(#avg-gradient)"
                  className="animate-pulse"
                />
                <path
                  d="M0,120 Q50,100 100,110 T200,90 T300,100 T400,80"
                  fill="none"
                  stroke="rgba(0,230,118,0.4)"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <path
                  d="M0,100 Q50,80 100,90 T200,70 T300,80 T400,60"
                  fill="none"
                  stroke="rgba(255,215,64,0.5)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </>
            )}
          </svg>
        </div>

        <div className="left-1 top-0 bottom-0 flex flex-col justify-between gap-5 sm:gap-7 py-2">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="h-2 w-6 bg-[rgba(0,230,118,0.1)] rounded-xs animate-pulse" />
          ))}
        </div>
      </div>

      {!isUptimeMode && (
        <div className="flex gap-5 mt-2 ml-1.5 sm:mx-5">
          <span className="inline-flex items-center gap-[0.35rem] font-jet-brains text-[0.65rem] text-[#1b5e20]">
            <span className="w-4 h-0.5 rounded-xs shrink-0 bg-[rgba(0,230,118,0.3)] animate-pulse" />
            <span className="w-20 h-2 bg-[rgba(0,230,118,0.1)] rounded-xs animate-pulse" />
          </span>
          <span className="inline-flex items-center gap-[0.35rem] font-jet-brains text-[0.65rem] text-[#1b5e20]">
            <span className="w-4 h-0.5 rounded-xs shrink-0 bg-[rgba(255,215,64,0.3)] animate-pulse" />
            <span className="w-24 h-2 bg-[rgba(0,230,118,0.1)] rounded-xs animate-pulse" />
          </span>
        </div>
      )}
    </div>
  )
}
