import { Global, Module } from '@nestjs/common'

import { RateLimitService } from './rate-limit.service'

@Global()
@Module({
  exports: [RateLimitService],
  providers: [RateLimitService],
})
export class RateLimitModule {}
