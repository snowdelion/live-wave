import { CreateMonitorDto } from './requests/create-monitor.dto'
import { UpdateMonitorDto } from './requests/update-monitor.dto'
import { DnsMonitorResponseDto } from './responses/dns-monitor-response.dto'
import { HttpMonitorResponseDto } from './responses/http-monitor-response.dto'
import { IcmpMonitorResponseDto } from './responses/icmp-monitor-response.dto'
import { MonitorCheckResponseDto } from './responses/monitor-check-response.dto'
import { MonitorResponseWithChecksDto } from './responses/monitor-response-with-checks.dto'
import { TcpMonitorResponseDto } from './responses/tcp-monitor-response.dto'

export const MONITOR_EXTRA_MODELS = [
  MonitorResponseWithChecksDto,
  MonitorCheckResponseDto,
  HttpMonitorResponseDto,
  IcmpMonitorResponseDto,
  TcpMonitorResponseDto,
  DnsMonitorResponseDto,
  CreateMonitorDto,
  UpdateMonitorDto,
] as const
