import { Pencil, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { UserMonitor } from '@/entities/monitor'

import { formatTime, getResponseColor, getUptimeColor } from '../../../lib/dashboard.utils'
import { TYPE_STYLE } from '../../../lib/monitor.constants'
import { SparkLine } from '../../shared/SparkLine'

export const MonitorRow = React.memo(
  ({
    monitor,
    onEdit,
    setDeleteTarget,
  }: {
    monitor: UserMonitor
    onEdit: (monitor: UserMonitor) => void
    setDeleteTarget: (monitor: UserMonitor) => void
  }) => {
    const { color, bg, Icon } = TYPE_STYLE[monitor.type]
    const isDown = monitor.lastStatus === 'down'
    const now = Date.now()

    return (
      <div
        key={monitor.id}
        className={`grid py-[0.9rem] px-5 border-b border-b-[rgba(0,230,118,0.05)] items-center border-l-2 transition-colors
                  ${isDown ? 'bg-[rgba(244,67,54,0.04)] border-l-[rgba(244,67,54,0.4)] hover:bg-[rgba(244,67,54,0.08)]' : 'bg-transparent border-l-transparent hover:bg-[rgba(0,230,118,0.03)]'}`}
        style={{
          gridTemplateColumns: '2fr 90px 90px 110px 100px 100px 90px 90px',
        }}
      >
        <div className="flex flex-col gap-[0.2rem] min-w-0">
          <span className="font-inter font-medium text-sm text-[#e8f5e8] whitespace-nowrap overflow-hidden truncate">
            {monitor.name}
          </span>
          <span className="font-jet-brains text-[0.68rem] text-[#2e7d32] whitespace-nowrap overflow-hidden truncate">
            {monitor.domain}
          </span>
        </div>

        <div>
          <span
            className="inline-flex items-center gap-[0.3rem] rounded-sm py-[0.2rem] px-2 font-jet-brains text-[0.65rem] tracking-wider"
            style={{
              background: bg,
              border: `1px solid ${color}28`,
              color,
            }}
          >
            <Icon size={10} strokeWidth={2} />
            {monitor.type}
          </span>
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-[0.35rem] font-jet-brains text-[0.72rem] font-medium ${isDown ? 'text-[#f44336]' : 'text-[#00e676]'}`}
          >
            <span
              className={`w-1.75 h-1.75 rounded-full shadow shrink-0 ${isDown ? 'bg-[#f44336] animate-pulse' : 'bg-[#00e676]'}`}
            />
            {monitor.lastStatus}
          </span>
        </div>

        <span className="font-jet-brains text-[0.72rem] text-[#4caf50]">
          {monitor.lastCheckedAt
            ? formatTime(Math.floor((now - monitor.lastCheckedAt.getTime()) / 1000))
            : '0s ago'}
        </span>

        <span
          className="font-jet-brains text-[0.78rem] font-medium"
          style={{ color: getResponseColor(monitor.type, monitor.trend.avgResponseTime, isDown) }}
        >
          {monitor.trend.avgResponseTime ? `${monitor.trend.avgResponseTime}ms` : '-'}
        </span>

        <div className="flex flex-col gap-[0.2rem]">
          <span
            className="font-jet-brains text-[0.78rem] font-medium"
            style={{ color: getUptimeColor(monitor.weekUptime) }}
          >
            {monitor.weekUptime && !isNaN(monitor.weekUptime)
              ? `${monitor.weekUptime.toFixed(2)}%`
              : '-'}
          </span>
        </div>

        <div>
          <SparkLine
            data={monitor.trend.sparkline}
            color={isDown ? '#f44336' : '#00e676'}
            width={72}
            height={24}
          />
        </div>

        <div className="flex gap-[0.4rem]">
          <Link
            href={`/dashboard/${monitor.id}`}
            title="View details"
            className="w-7 h-7 rounded-md bg-transparent border border-[rgba(0,230,118,0.15)] flex items-center justify-center transition-colors duration-200 hover:bg-[rgba(0,230,118,0.1)] active:opacity-80"
          >
            <Eye size={12} color="#4caf50" />
          </Link>
          <button
            onClick={() => onEdit(monitor)}
            title="Edit"
            className="w-7 h-7 rounded-md bg-transparent border border-[rgba(0,230,118,0.15)] flex items-center justify-center transition-colors duration-200 hover:bg-[rgba(0,230,118,0.1)] active:opacity-80"
          >
            <Pencil size={12} color="#4caf50" />
          </button>
          <button
            onClick={() => setDeleteTarget(monitor)}
            title="Delete"
            className="w-7 h-7 rounded-md bg-transparent border border-[rgba(244,67,54,0.2)] flex items-center justify-center transition-colors duration-200 hover:bg-[rgba(244,67,54,0.1)] active:opacity-80"
          >
            <Trash2 size={12} color="#f44336" />
          </button>
        </div>
      </div>
    )
  },
)
