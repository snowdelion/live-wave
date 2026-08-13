import { Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston'
import LokiTransport from 'winston-loki'

import { simpleFormat, jsonFormat } from './logger.utils'

const { combine, timestamp, colorize, errors, json } = format

@Injectable()
export class Logger implements LoggerService {
  private logger: WinstonLogger

  constructor(private config: ConfigService) {
    const isProduction = config.get<string>('NODE_ENV') === 'production'

    this.logger = createLogger({
      level: config.get<string>('LOG_LEVEL') || 'info',
      format: combine(timestamp(), errors({ stack: true })),
      transports: [
        new transports.Console({
          format: isProduction
            ? combine(timestamp(), json())
            : combine(timestamp(), colorize(), simpleFormat),
        }),
        ...(config.get<string>('LOKI_HOST')
          ? [
              new LokiTransport({
                host: config.get<string>('LOKI_HOST') ?? 'http://127.0.0.1:3100',
                labels: { app: 'live-wave-backend' },
                json: true,
                batching: true,
                timeout: 30,
                format: combine(timestamp(), jsonFormat),
              }),
            ]
          : []),
      ],
    })
  }

  child(ctx: Record<string, unknown>): Logger {
    const child = this.logger.child(ctx)
    const newLogger = new Logger(this.config)
    newLogger.logger = child
    return newLogger
  }

  log(message: string, ctx?: string | Record<string, unknown>) {
    if (typeof ctx === 'string') this.logger.info({ message, context: ctx })
    else this.logger.info({ message, ...ctx })
  }

  error(message: string, ctx?: string | Record<string, unknown>) {
    if (typeof ctx === 'string') this.logger.error({ message, context: ctx })
    else this.logger.error({ message, ...ctx })
  }

  warn(message: string, ctx?: string | Record<string, unknown>) {
    if (typeof ctx === 'string') this.logger.warn({ message, context: ctx })
    else this.logger.warn({ message, ...ctx })
  }

  debug(message: string, ctx?: string | Record<string, unknown>) {
    if (typeof ctx === 'string') this.logger.debug({ message, context: ctx })
    else this.logger.debug({ message, ...ctx })
  }

  verbose(message: string, ctx?: string | Record<string, unknown>) {
    if (typeof ctx === 'string') this.logger.verbose({ message, context: ctx })
    else this.logger.verbose({ message, ...ctx })
  }
}
