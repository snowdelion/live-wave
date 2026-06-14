import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

import { logAndThrow } from '../utils/error.utils'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Database connected successfully')
    } catch (e) {
      throw logAndThrow({
        name: PrismaService.name,
        context: 'connect to the database',
        e,
        exception: Error,
        exceptionContext: 'Database connection failed',
        shouldSetCause: true,
      })
    }
  }
}
