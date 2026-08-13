import { HttpStatus, Injectable } from '@nestjs/common'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { RedisService } from '@/shared/redis/redis.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

@Injectable()
export class HealthService {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: HealthService.name })
  }

  async getReadinessStatus() {
    const database = await this.checkDatabase()
    const redis = await this.checkRedis()

    const checks = {
      database: database.status,
      redis: redis.status,
    }

    const errors: Record<string, string> = {}
    if (database.error) errors.database = database.error
    if (redis.error) errors.redis = redis.error

    const isHealthy = Object.keys(errors).length === 0
    const statusCode = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE

    return { statusCode, body: { isHealthy, checks, errors } }
  }

  private async checkDatabase(): Promise<{ status: 'up' | 'down'; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'up' }
    } catch (e) {
      const message = getErrorMessage(e, 'Service unavailable')
      this.logger.warn('Health check failed', { component: 'database', message })
      return { status: 'down', error: message }
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down'; error?: string }> {
    try {
      await this.redis.ping()
      return { status: 'up' }
    } catch (e) {
      const message = getErrorMessage(e, 'Service unavailable')
      this.logger.warn('Health check failed', { component: 'redis', message })
      return { status: 'down', error: message }
    }
  }
}
