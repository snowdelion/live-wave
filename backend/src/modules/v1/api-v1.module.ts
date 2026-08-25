import { Module } from '@nestjs/common'

import { AnalyticsModule } from './analytics/analytics.module'
import { AuthModule } from './auth/auth.module'
import { HealthModule } from './health/health.module'
import { MonitorCheckModule } from './monitor-check/monitor-check.module'
import { MonitorsModule } from './monitors/monitors.module'
import { TelegramModule } from './notifications/telegram/telegram.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    HealthModule,
    MonitorsModule,
    MonitorCheckModule,
    AnalyticsModule,
    TelegramModule,
    AuthModule,
    UsersModule,
  ],
})
export class V1Module {}
