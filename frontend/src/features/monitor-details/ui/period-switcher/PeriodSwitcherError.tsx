export function PeriodSwitcherError() {
  return (
    <section className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="font-barlow font-extrabold text-[1.75rem] text-[#e8f5e8]  tracking-[0.02em] mb-[0.15rem]">
            MONITOR DETAILS
          </h1>
          <span className="font-jet-brains text-[0.68rem] text-[#f44336] tracking-[0.08em]">
            Failed to load monitor data
          </span>
        </div>
      </div>
    </section>
  )
}
