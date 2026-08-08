import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { tap } from 'rxjs/operators'

import { MetricsService } from '../metrics.service'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<Request>()
    const route = req.route as { path?: string }
    const path = route?.path || req.url || ''
    const method = req.method

    return next.handle().pipe(
      tap({
        next: () => {
          const res = ctx.switchToHttp().getResponse<Response>()
          const status = res.statusCode || 200
          this.metricsService.incrementEndpointRequest(method, status, path)
        },
        error: e => {
          let status = 500
          if (e instanceof HttpException) status = e.getStatus()
          this.metricsService.incrementEndpointRequest(method, status, path)
        },
      }),
    )
  }
}
