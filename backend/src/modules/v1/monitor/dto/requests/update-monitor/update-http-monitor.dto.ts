import { OmitType, PartialType } from '@nestjs/swagger'

import { CreateHttpMonitorDto } from '../create-monitor/create-http-monitor.dto'

export class UpdateHttpMonitorDto extends PartialType(OmitType(CreateHttpMonitorDto, ['type'])) {}
