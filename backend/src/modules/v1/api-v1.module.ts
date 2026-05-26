import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'

import { HealthModule } from './health/health.module'
import { SessionMiddleware } from './session/middleware/session.middleware'
import { SessionModule } from './session/session.module'
// import { TelegramModule } from './telegram/telegram.module'

@Module({
  imports: [
    SessionModule,
    HealthModule,
    //  TelegramModule
  ],
})
export class V1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*path')
  }
}
