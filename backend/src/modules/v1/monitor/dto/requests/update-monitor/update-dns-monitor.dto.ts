import { OmitType, PartialType } from '@nestjs/swagger'

import { CreateDnsMonitorDto } from '../create-monitor/create-dns-monitor.dto'

export class UpdateDnsMonitorDto extends PartialType(OmitType(CreateDnsMonitorDto, ['type'])) {}
