import { request } from '@/shared/api'
import { ERROR_CODES } from '@/shared/api/config/error-codes'

import { userMonitorsSchema } from '../dto/user-monitors.dto'
import { fetchMonitors } from '../fetch-monitors'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
    API_URL: { MONITOR: { ALL: '/api/monitor' } },
  }
})

describe('fetchMonitors', () => {
  const mockMonitors = [
    {
      id: 'monitor-1',
      name: 'Test Monitor',
      type: 'HTTP',
      checkInterval: 10,
      timeout: 5000,
      lastStatus: 'up',
      clientId: 'client-123',
      lastCheckedAt: new Date('2026-05-28T17:16:12.045Z'),
      nextCheckAt: new Date('2026-05-28T17:17:12.045Z'),
      createdAt: new Date('2026-05-28T17:16:12.045Z'),
      updatedAt: new Date('2026-05-28T17:16:12.045Z'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call request with correct parameters', async () => {
    const mockResponse = { data: mockMonitors, status: 200 }
    vi.mocked(request).mockResolvedValue(mockResponse)

    const result = await fetchMonitors()

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/monitor',
        schema: userMonitorsSchema,
        errorCode: ERROR_CODES.USER_MONITORS,
      }),
    )
    expect(result).toEqual(mockMonitors)
  })

  it('should throw an error if request fails', async () => {
    const error = new Error('Network error')
    vi.mocked(request).mockRejectedValue(error)

    await expect(fetchMonitors()).rejects.toThrow('Network error')
  })
})
