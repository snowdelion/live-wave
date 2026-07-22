import { Eye, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { UserMonitor } from '@/entities/monitor'

import { formatTime, getResponseColor, getUptimeColor } from '../../../lib/dashboard.utils'
import { TYPE_STYLE } from '../../../lib/monitor.constants'

export const MonitorCard = React.memo(
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

    return (
      <div
        key={monitor.id}
        className={`bg-[#0d120d] border rounded-lg p-5 transition-colors
                ${isDown ? 'border-[rgba(244,67,54,0.3)] bg-[rgba(244,67,54,0.04)]' : 'border-[rgba(0,230,118,0.1)]'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ background: bg, border: `1px solid ${color}30` }}
              >
                <Icon size={14} color={color} strokeWidth={2} />
              </div>
              <span className="font-inter font-semibold text-[#e8f5e8] text-[0.95rem] truncate">
                {monitor.name}
              </span>
            </div>
            <span className="block font-jet-brains text-[0.7rem] text-[#2e7d32] mt-1 truncate">
              {monitor.domain}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-jet-brains text-[0.7rem] font-medium ${
              isDown
                ? 'bg-[rgba(244,67,54,0.15)] text-[#f44336] border border-[rgba(244,67,54,0.2)]'
                : 'bg-[rgba(0,230,118,0.12)] text-[#00e676] border border-[rgba(0,230,118,0.2)]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isDown ? 'bg-[#f44336] animate-pulse' : 'bg-[#00e676]'}`}
            />
            {monitor.lastStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex flex-col">
            <span className="font-jet-brains text-[0.55rem] text-[#2e7d32] tracking-wider uppercase">
              Type
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0">
                <Icon size={12} color={color} strokeWidth={2} />
              </div>
              <span className="font-inter text-sm font-medium" style={{ color }}>
                {monitor.type}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-jet-brains text-[0.55rem] text-[#2e7d32] tracking-wider uppercase">
              Uptime 7d
            </span>
            <span
              className="font-inter text-sm font-semibold mt-0.5"
              style={{ color: getUptimeColor(monitor.weekUptime) }}
            >
              {monitor.weekUptime && !isNaN(monitor.weekUptime)
                ? `${monitor.weekUptime.toFixed(1)}%`
                : '-'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-jet-brains text-[0.55rem] text-[#2e7d32] tracking-wider uppercase">
              Response
            </span>
            <span
              className="font-inter text-sm font-medium mt-0.5"
              style={{
                color: getResponseColor(monitor.type, monitor.trend.avgResponseTime, isDown),
              }}
            >
              {monitor.trend.avgResponseTime ? `${monitor.trend.avgResponseTime}ms` : '-'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-jet-brains text-[0.55rem] text-[#2e7d32] tracking-wider uppercase">
              Last Check
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-inter text-sm text-[#4caf50]">
                {monitor.lastCheckedAt
                  ? formatTime(Math.floor((Date.now() - monitor.lastCheckedAt.getTime()) / 1000))
                  : '0s ago'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[rgba(0,230,118,0.06)]">
          <Link
            href={`/dashboard/${monitor.id}`}
            aria-label="View details"
            className="w-9 h-9 rounded-md bg-transparent border border-[rgba(0,230,118,0.15)] flex items-center justify-center transition-colors hover:bg-[rgba(0,230,118,0.08)] active:bg-[rgba(0,230,118,0.15)]"
          >
            <Eye size={15} color="#4caf50" />
          </Link>
          <button
            onClick={() => onEdit(monitor)}
            aria-label="Edit"
            className="w-9 h-9 rounded-md bg-transparent border border-[rgba(0,230,118,0.15)] flex items-center justify-center transition-colors hover:bg-[rgba(0,230,118,0.08)] active:bg-[rgba(0,230,118,0.15)]"
          >
            <Pencil size={15} color="#4caf50" />
          </button>
          <button
            onClick={() => setDeleteTarget(monitor)}
            aria-label="Delete"
            className="w-9 h-9 rounded-md bg-transparent border border-[rgba(244,67,54,0.2)] flex items-center justify-center transition-colors hover:bg-[rgba(244,67,54,0.08)] active:bg-[rgba(244,67,54,0.15)]"
          >
            <Trash2 size={15} color="#f44336" />
          </button>
        </div>
      </div>
    )
  },
)
