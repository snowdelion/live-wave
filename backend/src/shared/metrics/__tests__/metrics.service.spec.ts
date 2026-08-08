import { Counter } from 'prom-client'

import { MetricsService } from '../metrics.service'

vi.mock('prom-client', () => ({
  Counter: vi.fn().mockImplementation(options => ({
    options,
    inc: vi.fn(),
  })),
}))

describe('MetricsService', () => {
  let service: MetricsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MetricsService()
  })

  describe('initialization', () => {
    it('should create endpointRequests counter with correct config', () => {
      expect(Counter).toHaveBeenCalledTimes(2)

      expect(Counter).toHaveBeenNthCalledWith(1, {
        name: 'http_requests_total',
        help: 'Total numbers of requests to HTTP endpoints',
        labelNames: ['method', 'status', 'path'],
      })
    })

    it('should create checksCounter with correct config', () => {
      expect(Counter).toHaveBeenNthCalledWith(2, {
        name: 'monitor_checks_total',
        help: 'Total number of monitor checks performed',
        labelNames: ['status'],
      })
    })
  })

  describe('incrementEndpointRequest', () => {
    it('should call inc on endpointRequests counter with correct labels', () => {
      service.incrementEndpointRequest('POST', 201, '/api/v1/users')

      const endpointCounter = (Counter as any).mock.results[0].value

      expect(endpointCounter.inc).toHaveBeenCalledTimes(1)
      expect(endpointCounter.inc).toHaveBeenCalledWith({
        method: 'POST',
        status: 201,
        path: '/api/v1/users',
      })
    })
  })

  describe('incrementMonitorChecksRequest', () => {
    it('should call inc on checksCounter with "success" status', () => {
      service.incrementMonitorChecksRequest('success')

      const checksCounter = (Counter as any).mock.results[1].value

      expect(checksCounter.inc).toHaveBeenCalledTimes(1)
      expect(checksCounter.inc).toHaveBeenCalledWith({ status: 'success' })
    })

    it('should call inc on checksCounter with "failure" status', () => {
      service.incrementMonitorChecksRequest('failure')

      const checksCounter = (Counter as any).mock.results[1].value

      expect(checksCounter.inc).toHaveBeenCalledTimes(1)
      expect(checksCounter.inc).toHaveBeenCalledWith({ status: 'failure' })
    })
  })
})
