import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'

import { SessionMiddleware } from './session/middleware/session.middleware'
import { SessionModule } from './session/session.module'
// import { TelegramModule } from './telegram/telegram.module'

@Module({
  imports: [
    SessionModule,
    //  TelegramModule
  ],
})
export class V1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('/api/*path')
  }
}
