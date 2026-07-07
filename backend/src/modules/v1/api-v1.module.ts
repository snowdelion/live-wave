import { Module } from '@nestjs/common'

import { AnalyticsModule } from './analytics/analytics.module'
import { AuthModule } from './auth/auth.module'
import { HealthModule } from './health/health.module'
import { MonitorModule } from './monitor/monitor.module'
import { MonitorCheckModule } from './monitor-check/monitor-check.module'
import { NotificationModule } from './notification/notification.module'
import { TelegramModule } from './notification/telegram/telegram.module'

@Module({
  imports: [
    HealthModule,
    MonitorModule,
    MonitorCheckModule,
    AnalyticsModule,
    TelegramModule,
    NotificationModule,
    AuthModule,
  ],
})
export class V1Module {}
