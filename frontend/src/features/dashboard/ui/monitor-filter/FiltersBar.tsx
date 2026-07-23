import { useQueryClient } from '@tanstack/react-query'
import { RotateCw, Search, X } from 'lucide-react'

import { MonitorType, MONITOR_QUERY_KEYS } from '@/entities/monitor'

import { FilterSelectMobile } from './FilterSelectMobile'

export function FiltersBar({ search, onSearch, typeFilter, onTypeFilter }: FiltersBarProps) {
  const queryClient = useQueryClient()
  const refreshList = () =>
    void queryClient.invalidateQueries({ queryKey: MONITOR_QUERY_KEYS.list() })

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
      <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-60">
        <button
          onClick={refreshList}
          className="w-9.5 h-9.5 shrink-0 rounded-md bg-transparent flex items-center justify-center border border-[rgba(0,230,118,0.15)] hover:bg-[rgba(0,230,118,0.1)] active:opacity-80 transition-colors duration-200"
        >
          <RotateCw size={14} color="#2e7d32" />
        </button>

        <div className="relative flex-1">
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
              <X
                color="#2e7d32"
                className="absolute right-0.75 top-1/2 -translate-y-1/2"
                size={14}
              />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-25 sm:hidden">
        <FilterSelectMobile
          value={typeFilter}
          options={TYPES}
          onChange={val => onTypeFilter(val as MonitorType | 'ALL')}
        />
      </div>

      <div className="hidden sm:flex flex-wrap items-center gap-[0.4rem]">
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
    </div>
  )
}

const TYPE_STYLE = (active: boolean) =>
  `inline-flex items-center gap-[0.3rem] py-[0.35rem] px-[0.8rem] rounded-sm font-jet-brains text-[0.7rem] tracking-[0.06em] border transition-all duration-150 ${
    active
      ? 'border-[#00e676] text-[#00e676] bg-[rgba(0,230,118,0.05)]'
      : 'border-[rgba(0,230,118,0.12)] text-[#4caf50] hover:border-[rgba(0,230,118,0.25)]'
  }`

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
