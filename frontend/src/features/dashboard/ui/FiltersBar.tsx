import { Search, X } from 'lucide-react'

import { MonitorType, useMonitors } from '@/entities/monitor'

export function FiltersBar({ search, onSearch, typeFilter, onTypeFilter }: FiltersBarProps) {
  const { data: { monitors } = { monitors: [] } } = useMonitors()
  const total = monitors?.length

  return (
    <div className="flex items-center gap-4 mb-4 flex-wrap">
      <div className="relative shrink-0 min-w-55">
        <Search size={14} color="#2e7d32" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search monitors..."
          className="w-full box-border pl-9 pr-3 py-2 font-inter text-[0.85rem] text-[#e8f5e8] bg-[#0d120d] border border-[rgba(0,230,118,0.12)] rounded-md outline-none transition-colors duration-200 focus:border-[rgba(0,230,118,0.35)]"
        />
        {search.length > 0 && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full hover:bg-[#00e676]/10 transition-colors duration-200 w-5 h-5"
            onClick={() => onSearch('')}
          >
            <X color="#2e7d32" className="absolute right-0.75 top-1/2 -translate-y-1/2" size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-[0.4rem] flex-wrap">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => onTypeFilter(t as MonitorType | 'ALL')}
            className={TYPE_STYLE(typeFilter === t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-[rgba(0,230,118,0.08)] shrink-0" />

      <span className="ml-auto font-jet-brains text-[0.68rem] text-[#2e7d32] whitespace-nowrap">
        {total || 0} / 5 monitors
      </span>
    </div>
  )
}

const TYPE_STYLE = (active: boolean, color: string = '#00e676') =>
  `inline-flex items-center gap-[0.3rem] py-[0.35rem] px-[0.8rem] rounded-sm font-jet-brains text-[0.7rem] tracking-[0.06em] border transition-all duration-150 ${active ? `border-[${color}] text-[${color}]` : 'border-[rgba(0,230,118,0.12)] text-[#4caf50]'}`

interface FiltersBarProps {
  search: string
  onSearch: (v: string) => void
  typeFilter: MonitorType | 'ALL'
  onTypeFilter: (v: MonitorType | 'ALL') => void
}

const TYPES: Array<MonitorType | 'ALL'> = [
  'ALL',
  MonitorType.HTTP,
  MonitorType.TCP,
  MonitorType.ICMP,
  MonitorType.DNS,
]
