import { CreateDnsMonitorDto } from './requests/create-monitor/create-dns-monitor.dto'
import { CreateHttpMonitorDto } from './requests/create-monitor/create-http-monitor.dto'
import { CreateIcmpMonitorDto } from './requests/create-monitor/create-icmp-monitor.dto'
import { CreateTcpMonitorDto } from './requests/create-monitor/create-tcp-monitor.dto'
import { UpdateHttpMonitorDto } from './requests/update-monitor/update-http-monitor.dto'
import { UpdateIcmpMonitorDto } from './requests/update-monitor/update-icmp-monitor.dto'
import { UpdateTcpMonitorDto } from './requests/update-monitor/update-tcp-monitor.dto'
import { DnsMonitorResponseDto } from './responses/dns-monitor-response.dto'
import { HttpMonitorResponseDto } from './responses/http-monitor-response.dto'
import { IcmpMonitorResponseDto } from './responses/icmp-monitor-response.dto'
import { MonitorCheckResponseDto } from './responses/monitor-check-response.dto'
import { MonitorResponseWithChecksDto } from './responses/monitor-response-with-checks.dto'
import { TcpMonitorResponseDto } from './responses/tcp-monitor-response.dto'

export const MONITOR_EXTRA_MODELS = [
  MonitorResponseWithChecksDto,
  MonitorCheckResponseDto,
  CreateHttpMonitorDto,
  CreateTcpMonitorDto,
  CreateIcmpMonitorDto,
  CreateDnsMonitorDto,
  UpdateHttpMonitorDto,
  UpdateTcpMonitorDto,
  UpdateIcmpMonitorDto,
  HttpMonitorResponseDto,
  IcmpMonitorResponseDto,
  TcpMonitorResponseDto,
  DnsMonitorResponseDto,
] as const
