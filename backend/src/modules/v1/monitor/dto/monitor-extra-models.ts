import { CreateMonitorDto } from './requests/create-monitor.dto'
import { UpdateMonitorDto } from './requests/update-monitor.dto'
import { DnsMonitorResponseDto } from './responses/create-or-update/dns-monitor-response.dto'
import { HttpMonitorResponseDto } from './responses/create-or-update/http-monitor-response.dto'
import { IcmpMonitorResponseDto } from './responses/create-or-update/icmp-monitor-response.dto'
import { TcpMonitorResponseDto } from './responses/create-or-update/tcp-monitor-response.dto'
import { DetailedMonitorDto } from './responses/detailed-monitor.dto'
import { MonitorByUserResponseDto } from './responses/monitor-by-user-response.dto'
import { MonitorCheckResponseDto } from './responses/monitor-check-response.dto'

export const MONITOR_EXTRA_MODELS = [
  DetailedMonitorDto,
  MonitorCheckResponseDto,
  HttpMonitorResponseDto,
  IcmpMonitorResponseDto,
  TcpMonitorResponseDto,
  DnsMonitorResponseDto,
  CreateMonitorDto,
  UpdateMonitorDto,
  MonitorByUserResponseDto,
] as const
