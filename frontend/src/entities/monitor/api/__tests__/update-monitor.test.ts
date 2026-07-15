import { request, ERROR_CODES } from '@/shared/api'

import { monitorResponseSchema, type MonitorResponse } from '../dto/monitor-response.dto'
import {
  updateMonitorRequestSchema,
  type UpdateMonitorRequest,
} from '../dto/update-monitor-request.dto'
import { updateMonitor } from '../update-monitor'

// --- mocks ---
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
    API_URL: { MONITOR: { UPDATE: vi.fn((id: string) => `/api/monitor/${id}`) } },
  }
})

vi.mock('../dto/update-monitor-request.dto', () => ({
  updateMonitorRequestSchema: {
    parse: vi.fn(),
  },
}))

vi.mock('../dto/monitor-response.dto', () => ({
  monitorResponseSchema: {
    parse: vi.fn(),
  },
}))

const mockRequest = vi.mocked(request) as any

// --- tests ---
describe('updateMonitor', () => {
  const monitorId = 'monitor-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates the request body with monitorResponseSchema', async () => {
    const input = { name: 'My Monitor', checkInterval: 60 }
    const validated = { name: 'My Monitor', checkInterval: 60 }

    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      validated as unknown as UpdateMonitorRequest,
    )
    mockRequest.mockResolvedValue({ data: { id: monitorId } })

    await updateMonitor(monitorId, input as unknown as UpdateMonitorRequest)

    expect(updateMonitorRequestSchema.parse).toHaveBeenCalledTimes(1)
    expect(updateMonitorRequestSchema.parse).toHaveBeenCalledWith(input)
  })

  it('calls request with the correct URL, method, schema, and errorCode', async () => {
    const input = { name: 'My Monitor' }
    const validated = { name: 'My Monitor' }

    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      validated as unknown as UpdateMonitorRequest,
    )
    vi.mocked(monitorResponseSchema.parse).mockReturnValue(validated as unknown as MonitorResponse)
    mockRequest.mockResolvedValue({ data: { id: monitorId } })

    await updateMonitor(monitorId, input as unknown as UpdateMonitorRequest)

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/api/monitor/${monitorId}`,
        schema: monitorResponseSchema,
        method: 'PATCH',
        errorCode: ERROR_CODES.UPDATE_MONITOR,
        json: validated,
        isProtected: true,
      }),
    )
  })

  it('sends the validated body (not the raw input) as the json payload', async () => {
    const input = { name: '  Untrimmed  ' }
    const validated = { name: 'Untrimmed' }

    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      validated as unknown as UpdateMonitorRequest,
    )
    mockRequest.mockResolvedValue({ data: { id: monitorId } })

    await updateMonitor(monitorId, input as unknown as UpdateMonitorRequest)

    const callArgs = mockRequest.mock.calls[0][0]
    expect(callArgs.json).toEqual(validated)
    expect(callArgs.json).not.toEqual(input)
  })

  it('builds the URL using the given monitorId', async () => {
    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      {} as unknown as UpdateMonitorRequest,
    )
    mockRequest.mockResolvedValue({ data: {} })

    await updateMonitor('abc-999', {} as unknown as UpdateMonitorRequest)

    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/monitor/abc-999' }))
  })

  it('returns the data property from the request response', async () => {
    const responseData = {
      id: monitorId,
      name: 'My Monitor',
      checkInterval: 60,
    }

    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      {} as unknown as UpdateMonitorRequest,
    )
    mockRequest.mockResolvedValue({ data: responseData })

    const result = await updateMonitor(monitorId, {} as unknown as UpdateMonitorRequest)

    expect(result).toEqual(responseData)
  })

  it('propagates an error thrown by schema validation and never calls request', async () => {
    const input = { checkInterval: -1 }
    const validationError = new Error('Invalid checkInterval')

    vi.mocked(updateMonitorRequestSchema.parse).mockImplementation(() => {
      throw validationError
    })

    await expect(
      updateMonitor(monitorId, input as unknown as UpdateMonitorRequest),
    ).rejects.toThrow('Invalid checkInterval')
    expect(request).not.toHaveBeenCalled()
  })

  it('propagates an error thrown by request', async () => {
    const requestError = new Error('Network error')

    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      {} as unknown as UpdateMonitorRequest,
    )
    vi.mocked(request).mockRejectedValue(requestError)

    await expect(updateMonitor(monitorId, {} as unknown as UpdateMonitorRequest)).rejects.toThrow(
      'Network error',
    )
  })

  it('works with HTTP monitor fields (url, method)', async () => {
    const input = { url: 'https://example.com', method: 'HEAD' } as any
    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(input)
    mockRequest.mockResolvedValue({ data: { id: monitorId, ...input } })

    await updateMonitor(monitorId, input)

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          url: 'https://example.com',
          method: 'HEAD',
        }),
      }),
    )
  })

  it('works with DNS monitor fields (host, port, recordType)', async () => {
    const input = { host: 'example.com', port: 53, recordType: 'A' as const } as any
    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(input)
    mockRequest.mockResolvedValue({ data: { id: monitorId, ...input } })

    await updateMonitor(monitorId, input)

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          host: 'example.com',
          port: 53,
          recordType: 'A',
        }),
      }),
    )
  })

  it('handles an empty options object (no fields to update)', async () => {
    vi.mocked(updateMonitorRequestSchema.parse).mockReturnValue(
      {} as unknown as UpdateMonitorRequest,
    )
    mockRequest.mockResolvedValue({ data: { id: monitorId } })

    const result = await updateMonitor(monitorId, {} as unknown as UpdateMonitorRequest)

    expect(updateMonitorRequestSchema.parse).toHaveBeenCalledWith({})
    expect(result).toEqual({ id: monitorId })
  })
})
