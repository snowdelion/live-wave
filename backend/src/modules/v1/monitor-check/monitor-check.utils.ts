import {
  type DnsMonitor,
  type HttpMonitor,
  type IcmpMonitor,
  MonitorType,
  StatusEnum,
  type TcpMonitor,
} from '@prisma/client'

interface MonitorRelations {
  type: MonitorType
  httpMonitor: HttpMonitor | null
  tcpMonitor: TcpMonitor | null
  icmpMonitor: IcmpMonitor | null
  dnsMonitor: DnsMonitor | null
}
type MonitorWithRelations = { type: MonitorType } & MonitorRelations

const extractHost: Record<MonitorType, (monitor: MonitorWithRelations) => string | null> = {
  [MonitorType.HTTP]: m => (m.httpMonitor ? new URL(m.httpMonitor.url).hostname : null),
  [MonitorType.DNS]: m => m.dnsMonitor?.host ?? null,
  [MonitorType.ICMP]: m => m.icmpMonitor?.host ?? null,
  [MonitorType.TCP]: m => m.tcpMonitor?.host ?? null,
}

const extractConfig: Record<
  MonitorType,
  (monitor: MonitorWithRelations) => { url?: string; host?: string; port?: number }
> = {
  [MonitorType.HTTP]: m => (m.httpMonitor ? { url: m.httpMonitor.url } : {}),
  [MonitorType.TCP]: m =>
    m.tcpMonitor ? { host: m.tcpMonitor.host, port: m.tcpMonitor.port } : {},
  [MonitorType.ICMP]: m => (m.icmpMonitor ? { host: m.icmpMonitor.host } : {}),
  [MonitorType.DNS]: m => (m.dnsMonitor ? { host: m.dnsMonitor.host } : {}),
}

export function getTargetHost(monitor: MonitorRelations): string | null {
  return extractHost[monitor.type]?.(monitor) ?? null
}

export function getMonitorConfig(monitor: MonitorRelations) {
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
