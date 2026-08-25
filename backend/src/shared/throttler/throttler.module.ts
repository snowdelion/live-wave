import { Global, Module } from '@nestjs/common'
import { ThrottlerModule as OriginalThrottlerModule, seconds } from '@nestjs/throttler'

@Global()
@Module({
  imports: [
    OriginalThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: seconds(60), limit: 100 },
        { name: 'long', ttl: seconds(3600), limit: 1000 },
      ],
    }),
  ],
  exports: [OriginalThrottlerModule],
})
export class ThrottlerModule {}
