import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

import { Logger } from '../logger/logger.service'
import { logAndThrow } from '../utils/error.utils'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor(private logger: Logger) {
    super()
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Database connected successfully')
    } catch (e) {
      throw logAndThrow({
        logger: this.logger,
        context: 'connect to the database',
        e,
        exception: Error,
        exceptionContext: 'Database connection failed',
        shouldSetCause: true,
      })
    }
  }

  async onApplicationShutdown(signal?: string) {
    await this.$disconnect()
    this.logger.log('Prisma disconnected', { signal })
  }
}
