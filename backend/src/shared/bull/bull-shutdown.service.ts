import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import { Queue } from 'bullmq'

import { logAndThrow } from '../utils/error.utils'

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
      logAndThrow({
        name: BullShutdownService.name,
        context: 'close Bull queues on application shutdown',
        e,
        shouldThrow: false,
      })
    }
  }
}
