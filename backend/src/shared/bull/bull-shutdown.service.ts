import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { Queue } from 'bullmq'

import { Logger } from '../logger/logger.service'
import { logAndThrow } from '../utils/error.utils'

import { BULL_NAMES } from './bull.constants'

@Injectable()
export class BullShutdownService implements OnApplicationShutdown {
  constructor(
    @InjectQueue(BULL_NAMES.QUEUE) private queue: Queue,
    private logger: Logger,
  ) {}

  async onApplicationShutdown() {
    try {
      await this.queue.close()
      this.logger.log('Bull queue closed successfully')
    } catch (e) {
      logAndThrow({
        logger: this.logger,
        context: 'close Bull queues on application shutdown',
        e,
        shouldThrow: false,
      })
    }
  }
}
