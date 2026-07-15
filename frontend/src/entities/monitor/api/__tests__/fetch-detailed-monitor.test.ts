import { request } from '@/shared/api'
import { ERROR_CODES } from '@/shared/api/config/error-codes'

import { detailedMonitorSchema } from '../dto/detailed-monitor.dto'
import { fetchDetailedMonitor } from '../fetch-detailed-monitor'

// mocks
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
    API_URL: { MONITOR: { BY_ID: vi.fn((id: string) => `/api/monitor/${id}`) } },
  }
})

const mockedRequest = vi.mocked(request) as any

// tests
describe('fetchDetailedMonitor', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('calls request with the correct url, schema, and error code', async () => {
    const fakeData = { id: '123', name: 'Monitor 1' }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    await fetchDetailedMonitor('123')

    expect(mockedRequest).toHaveBeenCalledTimes(1)
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/monitor/123',
        schema: detailedMonitorSchema,
        errorCode: ERROR_CODES.DETAILED_MONITOR,
      }),
    )
  })

  it('interpolates the id into the url correctly', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { id: 'abc-def', name: 'X' } })

    await fetchDetailedMonitor('abc-def')

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/monitor/abc-def' }),
    )
  })

  it('returns the data field from the response', async () => {
    const fakeData = { id: '123', name: 'Monitor 1' }
    mockedRequest.mockResolvedValueOnce({ data: fakeData })

    const result = await fetchDetailedMonitor('123')

    expect(result).toEqual(fakeData)
  })

  it('propagates rejection if request throws', async () => {
    const error = new Error('Network error')
    mockedRequest.mockRejectedValueOnce(error)

    await expect(fetchDetailedMonitor('123')).rejects.toThrow('Network error')
  })

  it('propagates a schema validation error from request', async () => {
    const validationError = new Error('Invalid response shape')
    mockedRequest.mockRejectedValueOnce(validationError)

    await expect(fetchDetailedMonitor('bad-id')).rejects.toThrow('Invalid response shape')
  })

  it('handles an empty string id by still building the url', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { id: '', name: '' } })

    await fetchDetailedMonitor('')

    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/monitor/' }))
  })
})
