import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'

import { HealthModule } from './health/health.module'
import { MonitorModule } from './monitor/monitor.module'
import { SessionMiddleware } from './session/middleware/session.middleware'
import { SessionModule } from './session/session.module'

@Module({
  imports: [SessionModule, HealthModule, MonitorModule],
})
export class V1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*path')
  }
}
