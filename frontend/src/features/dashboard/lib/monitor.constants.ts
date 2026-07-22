import { Globe, Radio, Server, Wifi } from 'lucide-react'

import { MonitorType } from '@/entities/monitor'

export const MONITOR_TYPES: MonitorType[] = [
  MonitorType.HTTP,
  MonitorType.TCP,
  MonitorType.ICMP,
  MonitorType.DNS,
]

export const TYPE_STYLE: Record<
  MonitorType,
  { color: string; bg: string; Icon: React.ElementType }
> = {
  HTTP: { color: '#00e676', bg: 'rgba(0,230,118,0.1)', Icon: Globe },
  TCP: { color: '#40c4ff', bg: 'rgba(64,196,255,0.1)', Icon: Wifi },
  ICMP: { color: '#ffd740', bg: 'rgba(255,215,64,0.1)', Icon: Radio },
  DNS: { color: '#ea80fc', bg: 'rgba(234,128,252,0.1)', Icon: Server },
}
