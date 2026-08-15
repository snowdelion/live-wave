import { AlertCircle } from 'lucide-react'

export function MonitorTableDesktopError() {
  return (
    <div className="bg-[#0d120d] border border-[rgba(244,67,54,0.2)] rounded-lg overflow-hidden">
      <div
        className="grid py-3 px-5 border-b border-b-[rgba(244,67,54,0.1)] bg-[#080a08]"
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
            className="font-jet-brains text-[0.65rem] text-[#f44336] tracking-widest uppercase"
          >
            {col}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-16 px-5">
        <AlertCircle size={40} strokeWidth={1.5} className="text-[#f44336] mb-4" />
        <h3 className="font-barlow font-bold text-lg tracking-wide text-[#f44336] mb-2">
          Failed to load monitors
        </h3>
        <p className="font-inter text-sm text-center text-[#f44336]/70 mb-6">
          Unable to fetch monitor data
        </p>
      </div>
    </div>
  )
}
