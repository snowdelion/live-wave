import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import { Queue } from 'bullmq'

import { BULL_NAMES } from './bull.constants'

@Injectable()
export class BullShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(BullShutdownService.name)

  constructor(@InjectQueue(BULL_NAMES.QUEUE) private queue: Queue) {}

  async onApplicationShutdown() {
    try {
      await this.queue.close()
      this.logger.log(`Bull queue closed successfully`)
    } catch (e) {
      const isError = e instanceof Error
      const errorStack = isError ? e.stack : undefined
      const details = isError ? e.message : 'unknown error'

      this.logger.error(
        `Failed to close Bull queues on application shutdown: ${details}`,
        errorStack,
      )
    }
  }
}
