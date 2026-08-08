import { Controller, Get, Header, UseGuards } from '@nestjs/common'
import { register } from 'prom-client'

import { BearerAuthGuard } from './guards/bearer-auth.guard'

@Controller({ path: 'metrics', version: '1' })
export class MetricsController {
  @Get()
  @UseGuards(BearerAuthGuard)
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return await register.metrics()
  }
}
