import { Global, Module } from '@nestjs/common'

import { RateLimitGuard } from './guards/rate-limit.guard'
import { RateLimitService } from './rate-limit.service'

@Global()
@Module({
  exports: [RateLimitService, RateLimitGuard],
  providers: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
