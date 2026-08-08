import { Injectable } from '@nestjs/common'
import { Counter } from 'prom-client'

@Injectable()
export class MetricsService {
  private endpointRequests: Counter<string>
  private checksCounter: Counter<string>

  constructor() {
    this.endpointRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total numbers of requests to HTTP endpoints',
      labelNames: ['method', 'status', 'path'],
    })

    this.checksCounter = new Counter({
      name: 'monitor_checks_total',
      help: 'Total number of monitor checks performed',
      labelNames: ['status'],
    })
  }

  incrementEndpointRequest(method: string, status: number, path: string) {
    this.endpointRequests.inc({ method, status, path })
  }

  incrementMonitorChecksRequest(status: 'success' | 'failure') {
    this.checksCounter.inc({ status })
  }
}
