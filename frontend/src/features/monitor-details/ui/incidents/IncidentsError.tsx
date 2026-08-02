import { AlertCircle } from 'lucide-react'

export function IncidentsError() {
  return (
    <div className="bg-[#0d120d] border border-[rgba(244,67,54,0.2)] rounded-lg overflow-hidden mb-6">
      <div className="gap-[0.6rem] py-4 px-5 border-b border-b-[rgba(244,67,54,0.1)] bg-[#080a08] flex items-center">
        <AlertCircle size={15} color="#f44336" />
        <span className="text-sm sm:text-base font-barlow font-bold text-[#f44336] tracking-[0.04em]">
          RECENT INCIDENTS
        </span>
      </div>

      <div className="p-10 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} strokeWidth={1.5} className="text-[#f44336]" />
        <p className="text-center font-inter text-[0.9rem] text-[#f44336] mb-1">
          Failed to load incidents
        </p>
      </div>
    </div>
  )
}
