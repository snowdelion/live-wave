import { AppError, ERROR_CODES, request } from '@/shared/api'

import { deleteMonitor } from '../delete-monitor'

// --- mocks ---
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

const mockedRequest = vi.mocked(request)

// --- tests ---
describe('deleteMonitor', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('returns { success: true } when the server responds with 204', async () => {
    mockedRequest.mockResolvedValue({ status: 204, data: undefined })

    const result = await deleteMonitor('monitor-123')

    expect(result).toEqual({ success: true })
  })

  it('returns { success: true } when the server responds with 200', async () => {
    mockedRequest.mockResolvedValue({ status: 200, data: undefined })

    const result = await deleteMonitor('monitor-123')

    expect(result).toEqual({ success: true })
  })

  it('calls request with the correct url, method, and errorCode', async () => {
    mockedRequest.mockResolvedValue({ status: 204, data: undefined })

    await deleteMonitor('monitor-123')

    expect(mockedRequest).toHaveBeenCalledTimes(1)
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/monitor/monitor-123',
        method: 'DELETE',
        errorCode: ERROR_CODES.DELETE_MONITOR,
      }),
    )
  })

  it('interpolates the monitorId into the url', async () => {
    mockedRequest.mockResolvedValue({ status: 204, data: undefined })

    await deleteMonitor('abc-xyz-999')

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/monitor/abc-xyz-999' }),
    )
  })

  it('throws an AppError with the DELETE_MONITOR code and expected message on non-204 status', async () => {
    mockedRequest.mockResolvedValue({ status: 404, data: undefined })

    await expect(deleteMonitor('missing-monitor')).rejects.toMatchObject({
      code: ERROR_CODES.DELETE_MONITOR,
      message: 'Failed to delete monitor',
    })
  })

  it.each([201, 202, 404, 500])('throws for any non-204 status (%i)', async status => {
    mockedRequest.mockResolvedValue({ status, data: undefined })

    await expect(deleteMonitor('monitor-123')).rejects.toThrow(AppError)
  })

  it('propagates errors thrown by request itself (e.g. network failure)', async () => {
    const networkError = new AppError(ERROR_CODES.DELETE_MONITOR, 'Network error')
    mockedRequest.mockRejectedValue(networkError)

    await expect(deleteMonitor('monitor-123')).rejects.toBe(networkError)
  })
})
