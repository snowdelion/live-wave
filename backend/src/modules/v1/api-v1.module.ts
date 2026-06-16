import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'

import { AnalyticsModule } from './analytics/analytics.module'
import { HealthModule } from './health/health.module'
import { MonitorModule } from './monitor/monitor.module'
import { MonitorCheckModule } from './monitor-check/monitor-check.module'
import { NotificationModule } from './notification/notification.module'
import { TelegramModule } from './notification/telegram/telegram.module'
import { SessionMiddleware } from './session/middleware/session.middleware'
import { SessionModule } from './session/session.module'

@Module({
  imports: [
    SessionModule,
    HealthModule,
    MonitorModule,
    MonitorCheckModule,
    AnalyticsModule,
    TelegramModule,
    NotificationModule,
  ],
})
export class V1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*path')
  }
}
