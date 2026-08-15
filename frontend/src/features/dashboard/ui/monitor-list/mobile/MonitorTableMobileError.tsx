import { AlertCircle } from 'lucide-react'

export function MonitorTableMobileError() {
  return (
    <div className="bg-[#0d120d] border border-[rgba(244,67,54,0.2)] rounded-lg p-14 flex flex-col items-center justify-center text-center">
      <AlertCircle size={40} strokeWidth={1.5} className="text-[#f44336] mb-4" />
      <h3 className="font-barlow font-bold tracking-wide text-base sm:text-lg text-[#f44336] mb-2">
        Failed to load monitors
      </h3>
      <p className="font-inter text-xs sm:text-sm text-[#f44336]/70 mb-6">
        Unable to fetch monitor data
      </p>
    </div>
  )
}
