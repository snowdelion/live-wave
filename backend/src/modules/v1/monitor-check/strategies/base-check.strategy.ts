import { Injectable } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'
import { InputJsonValue } from '@prisma/client/runtime/library'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

@Injectable()
export abstract class BaseCheckStrategy {
  protected logger: Logger
  constructor(
    protected prisma: PrismaService,
    baseLogger: Logger,
    context: string,
  ) {
    this.logger = baseLogger.child({ context })
  }

  protected async confirmCheckResult(monitorId: string, result: CheckResult) {
    try {
      await this.prisma.$transaction([
        this.prisma.check.create({
          data: {
            monitorId,
            status: result.status,
            responseTime: result.responseTime,
            error: result.error,
            details: result.details,
          },
        }),
        this.prisma.check.deleteMany({
          where: {
            monitorId,
            checkedAt: { lt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
          },
        }),
      ])
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'P2003') {
        this.logger.warn('Monitor not found, skipping check save', { monitorId })
        return
      }
      this.logger.error('Transaction failed for check', {
        monitorId,
        error: getErrorMessage(e),
      })
    }
  }
}

interface CheckResult {
  status: StatusEnum
  responseTime: number | null
  error: string | null
  details: InputJsonValue
}
