import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'

import { MetricsService } from './metrics.service'

@Catch()
export class MetricsFilter implements ExceptionFilter {
  constructor(private metricsService: MetricsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.message
    }

    const method = req.method
    const route = req.route as { path?: string }
    const path = route?.path || req.url || ''

    this.metricsService.incrementEndpointRequest(method, status, path)

    return res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
    })
  }
}
