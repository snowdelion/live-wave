import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'

import { MetricsModule } from '@/shared/metrics/metrics.module'

import { TelegramModule } from '../notifications/telegram/telegram.module'

import { MonitorCheckScheduler } from './monitor-check.scheduler'
import { MonitorCheckService } from './monitor-check.service'
import { DnsStrategy } from './strategies/dns-check.strategy'
import { HttpStrategy } from './strategies/http-check.strategy'
import { IcmpStrategy } from './strategies/icmp-check.strategy'
import { TcpStrategy } from './strategies/tcp-check.strategy'

@Module({
  imports: [ScheduleModule, MetricsModule, TelegramModule],
  providers: [
    MonitorCheckService,
    MonitorCheckScheduler,
    HttpStrategy,
    TcpStrategy,
    IcmpStrategy,
    DnsStrategy,
  ],
  exports: [MonitorCheckService],
})
export class MonitorCheckModule {}
