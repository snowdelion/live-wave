import dayjs from 'dayjs'
import { useId } from 'react'

export function MonitorDetailsTooltip({
  mode,
  active,
  payload,
  label,
  shouldShowP95 = false,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const date = dayjs(label).format('DD.MM.YYYY')
  const time = dayjs(label).format('HH:mm')

  const values: {
    dataKey?: string
    value?: number
    color: string
    sub: string
    title: string
  }[] = []

  const id = useId()

  if (mode === 'uptime') {
    const uptime = {
      ...payload.find(p => p.dataKey === 'uptime'),
      title: 'Uptime',
      color: '#00e676',
      sub: '%',
    }
    values.push(uptime)
  }

  if (mode === 'latency') {
    const avg = {
      ...payload.find(p => p.dataKey === 'averageResponseTime'),
      title: 'Avg',
      color: '#00e676',
      sub: 'ms',
    }
    values.push(avg)

    if (shouldShowP95) {
      const p95 = {
        ...payload.find(p => p.dataKey === 'p95ResponseTime'),
        title: 'P95',
        color: '#ffd740',
        sub: 'ms',
      }
      values.push(p95)
    }
  }

  return (
    <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.2)] rounded-md px-3 py-2 shadow-lg pointer-events-none min-w-35">
      <div className="flex flex-col justify-center items-start gap-1.5 mb-2 pb-2 border-b border-[rgba(0,230,118,0.1)]">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-[#4caf50]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="font-jet-brains text-[0.65rem] text-[#4caf50]">{date}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-[#4caf50]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-jet-brains text-[0.65rem] text-[#4caf50]">{time}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {values.length > 0 &&
          values.map(v => (
            <div key={v.dataKey || id}>
              {v && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.color }} />
                    <span className="font-jet-brains text-[0.65rem] text-[#2e7d32]">{v.title}</span>
                  </div>
                  <span className="font-jet-brains text-[0.7rem] text-[#e8f5e8] font-medium tabular-nums">
                    {v.value?.toFixed(1)}
                    <span className="text-[#2e7d32] ml-0.5">{v.sub}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

interface CustomTooltipProps {
  mode: 'uptime' | 'latency'
  shouldShowP95?: boolean

  payload?: Array<{ dataKey: string; value: number }>
  active?: boolean
  label?: string
}
