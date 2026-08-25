import type {
  DnsMonitor,
  HttpMonitor,
  IcmpMonitor,
  MonitorType,
  StatusEnum,
  TcpMonitor,
} from '@prisma/client'

export type StrategyResult = {
  status: StatusEnum
  error?: string | null
  responseTime: number | null
  checkedAt: Date
}

export interface StrategyContext {
  id: string
  timeout: number
  name: string
  userId: string
  type: MonitorType
  lastStatus: StatusEnum | null
  checkInterval: number
  httpMonitor?: HttpMonitor | null
  tcpMonitor?: TcpMonitor | null
  icmpMonitor?: IcmpMonitor | null
  dnsMonitor?: DnsMonitor | null
}

export interface CheckStrategy {
  check(monitor: StrategyContext): Promise<StrategyResult>
}
