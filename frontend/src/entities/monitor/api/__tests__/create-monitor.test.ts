import { ERROR_CODES } from '@/shared/api'

import { MonitorType } from '../../model/monitor.types'
import { createMonitor } from '../create-monitor'
import type { CreateMonitorRequest } from '../dto/create-monitor-request.dto'

// mocks
const requestMock = vi.fn()

vi.mock('@/shared/api', () => ({
  request: (...args: unknown[]) => requestMock(...args),
  ERROR_CODES: { CREATE_MONITOR: 'CREATE_MONITOR' },
  API_URL: { MONITOR: { CREATE: '/api/monitor' } },
}))

vi.mock('../dto/create-and-update-monitor.dto', () => ({
  CreateMonitorRequestSchema: {
    parse: vi.fn(input => input),
  },
  MonitorResponseSchema: {},
}))

// tests
describe('createMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const httpBody = {
    name: 'My HTTP monitor',
    type: MonitorType.HTTP,
    url: 'https://example.com',
    method: 'HEAD' as const,
  }

  it('validates the input body with CreateMonitorRequestSchema before sending the request', async () => {
    requestMock.mockResolvedValueOnce({ data: { id: '1' } })

    await createMonitor(httpBody as unknown as CreateMonitorRequest)
  })

  it('sends a POST request to /api/monitor with the expected schema and error code', async () => {
    requestMock.mockResolvedValueOnce({ data: { id: '1' } })

    await createMonitor(httpBody as unknown as CreateMonitorRequest)

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/monitor',
        method: 'POST',
        schema: expect.any(Object),
        json: expect.objectContaining({
          name: httpBody.name,
          type: httpBody.type,
          url: httpBody.url,
          method: httpBody.method,
        }),
        errorCode: ERROR_CODES.CREATE_MONITOR,
      }),
    )
  })

  it('returns the data field from the response', async () => {
    const responseData = { id: 'abc123', name: 'My HTTP monitor' }
    requestMock.mockResolvedValueOnce({ data: responseData })

    const result = await createMonitor(httpBody as unknown as CreateMonitorRequest)

    expect(result).toBe(responseData)
  })

  it('propagates errors thrown by the request call', async () => {
    const requestError = new Error('Network error')
    requestMock.mockRejectedValueOnce(requestError)

    await expect(createMonitor(httpBody as unknown as CreateMonitorRequest)).rejects.toThrow(
      'Network error',
    )
  })

  describe('monitor type variants', () => {
    it('accepts and forwards an ICMP monitor body', async () => {
      const icmpBody = {
        name: 'Ping monitor',
        type: MonitorType.ICMP,
        host: '1.1.1.1',
      }
      requestMock.mockResolvedValueOnce({ data: { id: '2' } })

      await createMonitor(icmpBody as unknown as CreateMonitorRequest)

      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({
            name: icmpBody.name,
            type: icmpBody.type,
            host: icmpBody.host,
          }),
        }),
      )
    })

    it('accepts and forwards a TCP monitor body', async () => {
      const tcpBody = {
        name: 'TCP monitor',
        type: MonitorType.TCP,
        host: '10.0.0.1',
        port: 443,
      }
      requestMock.mockResolvedValueOnce({ data: { id: '3' } })

      await createMonitor(tcpBody as unknown as CreateMonitorRequest)

      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({
            name: tcpBody.name,
            type: tcpBody.type,
            host: tcpBody.host,
            port: tcpBody.port,
          }),
        }),
      )
    })

    it('accepts and forwards a DNS monitor body', async () => {
      const dnsBody = {
        name: 'DNS monitor',
        type: MonitorType.DNS,
        host: 'example.com',
        recordType: 'A' as const,
      }
      requestMock.mockResolvedValueOnce({ data: { id: '4' } })

      await createMonitor(dnsBody as unknown as CreateMonitorRequest)

      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({
            name: dnsBody.name,
            type: dnsBody.type,
            host: dnsBody.host,
            recordType: dnsBody.recordType,
          }),
        }),
      )
    })

    it('forwards optional checkInterval and timeout when provided', async () => {
      const bodyWithOptionals = {
        ...httpBody,
        checkInterval: 60,
        timeout: 5000,
      }
      requestMock.mockResolvedValueOnce({ data: { id: '5' } })

      await createMonitor(bodyWithOptionals as unknown as CreateMonitorRequest)

      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({
            name: bodyWithOptionals.name,
            type: bodyWithOptionals.type,
            url: bodyWithOptionals.url,
            method: bodyWithOptionals.method,
            checkInterval: bodyWithOptionals.checkInterval,
            timeout: bodyWithOptionals.timeout,
          }),
        }),
      )
    })
  })
})
