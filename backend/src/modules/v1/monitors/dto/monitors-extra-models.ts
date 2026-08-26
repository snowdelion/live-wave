import { CreateMonitorDto } from './requests/create-monitor.dto'
import { UpdateMonitorDto } from './requests/update-monitor.dto'
import {
  CreateDnsMonitorResponse,
  UpdateDnsMonitorResponse,
} from './responses/create-or-update/dns-monitor-response.dto'
import {
  CreateHttpMonitorResponse,
  UpdateHttpMonitorResponse,
} from './responses/create-or-update/http-monitor-response.dto'
import {
  CreateIcmpMonitorResponse,
  UpdateIcmpMonitorResponse,
} from './responses/create-or-update/icmp-monitor-response.dto'
import {
  CreateTcpMonitorResponse,
  UpdateTcpMonitorResponse,
} from './responses/create-or-update/tcp-monitor-response.dto'
import { DetailedMonitorDto } from './responses/detailed-monitor.dto'
import { MonitorsByUserResponseDto } from './responses/monitors-by-user-response.dto'

export const MONITORS_EXTRA_MODELS = [
  DetailedMonitorDto,
  CreateHttpMonitorResponse,
  UpdateHttpMonitorResponse,
  CreateTcpMonitorResponse,
  UpdateTcpMonitorResponse,
  CreateIcmpMonitorResponse,
  UpdateIcmpMonitorResponse,
  CreateDnsMonitorResponse,
  UpdateDnsMonitorResponse,
  CreateMonitorDto,
  UpdateMonitorDto,
  MonitorsByUserResponseDto,
] as const
