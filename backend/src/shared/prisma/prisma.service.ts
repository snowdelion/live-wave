import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Database connected successfully')
    } catch (e) {
      const { msg, errorStack, error } = this.getErrorInfo(e)

      this.logger.error(msg, errorStack)
      throw new Error(msg, { cause: error })
    }
  }

  private readonly logger = new Logger(PrismaService.name)

  private getErrorInfo(e: unknown) {
    const isError = e instanceof Error
    const errorMsg = isError ? e.message : 'unexpected error'
    const errorStack = isError ? e.stack : undefined
    const msg = `Database connection failed: ${errorMsg}`

    return { msg, errorStack, error: e }
  }
}
