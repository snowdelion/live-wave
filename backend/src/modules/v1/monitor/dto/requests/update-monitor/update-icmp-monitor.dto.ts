import { OmitType, PartialType } from '@nestjs/swagger'

import { CreateIcmpMonitorDto } from '../create-monitor/create-icmp-monitor.dto'

export class UpdateIcmpMonitorDto extends PartialType(OmitType(CreateIcmpMonitorDto, ['type'])) {}
