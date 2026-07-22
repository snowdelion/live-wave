export function MonitorTableDesktopSkeleton() {
  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg overflow-hidden animate-pulse">
      <div
        className="grid py-3 px-5 border-b border-b-[rgba(0,230,118,0.08)] bg-[#080a08]"
        style={{
          gridTemplateColumns: '2fr 90px 90px 110px 100px 100px 90px 90px',
        }}
      >
        {[
          'Monitor',
          'Type',
          'Status',
          'Last Check',
          'Response',
          'Uptime 7d',
          'Trend',
          'Actions',
        ].map(col => (
          <span
            key={col}
            className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest uppercase"
          >
            {col}
          </span>
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="grid py-[0.9rem] px-5 h-[4.325rem] border-b border-b-[rgba(0,230,118,0.05)] items-center"
          style={{
            gridTemplateColumns: '2fr 90px 90px 110px 100px 100px 90px 90px',
          }}
        >
          <div className="flex flex-col gap-[0.2rem] min-w-0">
            <div className="h-4 w-32 bg-[rgba(0,230,118,0.08)] rounded-sm" />
            <div className="h-3 w-24 bg-[rgba(0,230,118,0.06)] rounded-sm" />
          </div>

          <div className="h-6 w-16 bg-[rgba(0,230,118,0.08)] rounded-sm" />
          <div className="h-5 w-14 bg-[rgba(0,230,118,0.08)] rounded-sm" />
          <div className="h-4 w-16 bg-[rgba(0,230,118,0.08)] rounded-sm" />
          <div className="h-4 w-14 bg-[rgba(0,230,118,0.08)] rounded-sm" />
          <div className="h-4 w-16 bg-[rgba(0,230,118,0.08)] rounded-sm" />
          <div className="h-6 w-16 bg-[rgba(0,230,118,0.08)] rounded-sm" />

          <div className="flex gap-[0.4rem]">
            <div className="w-7 h-7 rounded-md bg-[rgba(0,230,118,0.08)]" />
            <div className="w-7 h-7 rounded-md bg-[rgba(0,230,118,0.08)]" />
            <div className="w-7 h-7 rounded-md bg-[rgba(0,230,118,0.08)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
