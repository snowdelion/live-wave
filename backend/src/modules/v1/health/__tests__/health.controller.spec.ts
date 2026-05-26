import type { Response } from 'express'

import { HealthController } from '../health.controller'
import type { HealthService } from '../health.service'

// --- mocks ---
const mockHealthService = {
  getReadinessStatus: vi.fn(),
}

const mockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res
}

// --- tests ---
describe('HealthController', () => {
  let controller: HealthController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new HealthController(mockHealthService as unknown as HealthService)
  })

  describe('liveness()', () => {
    it('returns status OK', () => {
      expect(controller.liveness()).toEqual({ status: 'OK' })
    })
  })

  describe('readiness()', () => {
    it('returns 200 with healthy body when all dependencies are up', async () => {
      const body = { isHealthy: true, checks: { database: 'up', redis: 'up' }, errors: {} }
      mockHealthService.getReadinessStatus.mockResolvedValue({ statusCode: 200, body })

      const res = mockResponse()
      await controller.readiness(res as unknown as Response)

      expect(mockHealthService.getReadinessStatus).toHaveBeenCalledOnce()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(body)
    })

    it('returns 503 with unhealthy body when a dependency is down', async () => {
      const body = {
        isHealthy: false,
        checks: { database: 'up', redis: 'down' },
        errors: { redis: 'Reached the max retries per request limit' },
      }
      mockHealthService.getReadinessStatus.mockResolvedValue({ statusCode: 503, body })

      const res = mockResponse()
      await controller.readiness(res as unknown as Response)

      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith(body)
    })

    it('propagates errors thrown by the health service', async () => {
      mockHealthService.getReadinessStatus.mockRejectedValue(new Error('Unexpected failure'))

      const res = mockResponse()
      await expect(controller.readiness(res as unknown as Response)).rejects.toThrow(
        'Unexpected failure',
      )
    })
  })
})
