import { Module } from '@nestjs/common'

import { AnalyticsModule } from './analytics/analytics.module'
import { AuthModule } from './auth/auth.module'
import { HealthModule } from './health/health.module'
import { MonitorCheckModule } from './monitor-check/monitor-check.module'
import { MonitorsModule } from './monitors/monitors.module'
import { NotificationModule } from './notification/notification.module'
import { TelegramModule } from './notification/telegram/telegram.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    HealthModule,
    MonitorsModule,
    MonitorCheckModule,
    AnalyticsModule,
    TelegramModule,
    NotificationModule,
    AuthModule,
    UsersModule,
  ],
})
export class V1Module {}
