import type { MonitorType } from '@/entities/monitor'

export const urlRefine = (value: string) => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0s ago'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`
  if (seconds < 63072000) return `${Math.floor(seconds / 31536000)}y ago`
  return 'Never checked'
}

export const getUptimeColor = (value: number | null) => {
  if (!value) return '#e8f5e8'
  if (99.5 <= value) return '#00e676'
  if (98 <= value) return '#ffd740'
  return '#f44336'
}

export const getResponseColor = (
  type: MonitorType,
  avg: number | null,
  isDown: boolean,
): string => {
  if (isDown) return '#f44336'
  if (avg === null) return '#4caf50'

  const thresholds: Record<MonitorType, { ok: number; warn: number }> = {
    HTTP: { ok: 500, warn: 1000 },
    TCP: { ok: 100, warn: 300 },
    ICMP: { ok: 100, warn: 300 },
    DNS: { ok: 100, warn: 300 },
  }

  const { ok, warn } = thresholds[type]
  if (avg <= ok) return '#e8f5e8'
  if (avg <= warn) return '#ffd740'
  return '#f44336'
}
