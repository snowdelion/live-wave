import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BullShutdownService } from '@/backend/shared/bull/bull-shutdown.service'
import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'

import { MonitorCheckProcessor } from './monitor-check.processor'
import { MonitorCheckService } from './monitor-check.service'
import { DnsStrategy } from './strategies/dns-check.strategy'
import { HttpStrategy } from './strategies/http-check.strategy'
import { IcmpStrategy } from './strategies/icmp-check.strategy'
import { TcpStrategy } from './strategies/tcp-check.strategy'

@Module({
  imports: [
    BullModule.registerQueue({ name: BULL_NAMES.QUEUE }),
    BullModule.registerQueue({ name: BULL_NAMES.NOTIFICATION }),
  ],
  providers: [
    MonitorCheckService,
    MonitorCheckProcessor,

    BullShutdownService,
    HttpStrategy,
    TcpStrategy,
    IcmpStrategy,
    DnsStrategy,
  ],
  exports: [MonitorCheckService],
})
export class MonitorCheckModule {}
