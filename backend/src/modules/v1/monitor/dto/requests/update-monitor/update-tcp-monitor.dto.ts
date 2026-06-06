import { OmitType, PartialType } from '@nestjs/swagger'

import { CreateTcpMonitorDto } from '../create-monitor/create-tcp-monitor.dto'

export class UpdateTcpMonitorDto extends PartialType(OmitType(CreateTcpMonitorDto, ['type'])) {}
