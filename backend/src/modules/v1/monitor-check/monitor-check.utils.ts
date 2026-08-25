import { MonitorType, StatusEnum } from '@prisma/client'

import type { StrategyContext } from './strategies/strategy-result.types'

const extractHost: Record<MonitorType, (monitor: StrategyContext) => string | null> = {
  [MonitorType.HTTP]: m => {
    if (!m.httpMonitor) return null
    try {
      return new URL(m.httpMonitor.url).hostname
    } catch {
      return null
    }
  },
  [MonitorType.DNS]: m => m.dnsMonitor?.host ?? null,
  [MonitorType.ICMP]: m => m.icmpMonitor?.host ?? null,
  [MonitorType.TCP]: m => m.tcpMonitor?.host ?? null,
}

const extractConfig: Record<
  MonitorType,
  (monitor: StrategyContext) => { url?: string; host?: string; port?: number }
> = {
  [MonitorType.HTTP]: m => (m.httpMonitor ? { url: m.httpMonitor.url } : {}),
  [MonitorType.TCP]: m =>
    m.tcpMonitor ? { host: m.tcpMonitor.host, port: m.tcpMonitor.port } : {},
  [MonitorType.ICMP]: m => (m.icmpMonitor ? { host: m.icmpMonitor.host } : {}),
  [MonitorType.DNS]: m => (m.dnsMonitor ? { host: m.dnsMonitor.host } : {}),
}

export function getTargetHost(monitor: StrategyContext): string | null {
  return extractHost[monitor.type]?.(monitor) ?? null
}

export function getMonitorConfig(monitor: StrategyContext) {
  return extractConfig[monitor.type]?.(monitor) ?? {}
}

export function formatNotificationMessage({
  monitorName,
  monitorType,
  monitorConfig,
  status,
  error,
  responseTime,
  checkedAt,
}: FormatNotificationMessageOptions) {
  const emoji = status === StatusEnum.up ? '😊' : '🐛'
  const type = MonitorType[monitorType]

  let config = ''
  if (monitorConfig.url) config = `URL: ${monitorConfig.url}`
  else if (monitorConfig.host) {
    config = `Host: ${monitorConfig.host}`
    if (monitorConfig.port) config += `:${monitorConfig.port}`
  }

  const time = checkedAt.toLocaleString()

  let message: string

  if (status === StatusEnum.down)
    message = `<b>Monitor "${monitorName}" (${type}) is ${status.toUpperCase()}! ${emoji}</b>`
  else
    message = `<b>Monitor "${monitorName}" (${type}) is ${status.toUpperCase()} again! ${emoji}</b>`

  message += `\n\n<i>Time: ${time}</i>`
  if (config) message += `\n<i>${config}</i>`
  if (status === StatusEnum.up && responseTime)
    message += `\n<i>Response time: ${responseTime} ms</i>`
  if (status === StatusEnum.down && error) message += `\n<i>Error details: ${error}</i>`

  return message
}

interface FormatNotificationMessageOptions {
  monitorName: string
  monitorType: MonitorType
  monitorConfig: { url?: string; host?: string; port?: number }
  status: StatusEnum
  error: string | null
  responseTime: number | null
  checkedAt: Date
}
