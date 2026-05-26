import { Controller, Get, Res } from '@nestjs/common'
import type { Response } from 'express'

import { HealthDocs } from './decorators/health-docs.decorator'
import { livenessDocs, readinessDocs } from './health.docs'
import { HealthService } from './health.service'

@Controller('v1/health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('liveness')
  @HealthDocs(livenessDocs)
  liveness() {
    return { status: 'OK' }
  }

  @Get('readiness')
  @HealthDocs(readinessDocs)
  async readiness(@Res() res: Response) {
    const { statusCode, body } = await this.healthService.getReadinessStatus()
    return res.status(statusCode).json(body)
  }
}
