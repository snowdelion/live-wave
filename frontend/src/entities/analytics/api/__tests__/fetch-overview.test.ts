import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { analyticsOverviewSchema } from '../dto/analytics-overview.dto'
import { fetchOverview } from '../fetch-overview'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

describe('fetchOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call request with correct parameters and return data', async () => {
    const mockData = {
      monitorId: 'mon-123',
      monitorName: 'My Monitor',
      periodDays: 14,
      totalChecks: 100,
      uptime: 99.9,
    }
    vi.mocked(request).mockResolvedValue({ data: mockData } as any)

    const result = await fetchOverview('mon-123', 14)

    expect(request).toHaveBeenCalledWith({
      url: API_URL.ANALYTICS.OVERVIEW('mon-123', 14),
      schema: analyticsOverviewSchema,
      errorCode: ERROR_CODES.OVERVIEW_ANALYTICS,
      isProtected: true,
    })

    expect(result).toEqual(mockData)
  })

  it('should use the default days parameter (7) if not provided', async () => {
    const mockData = {
      monitorId: 'mon-123',
      monitorName: 'My Monitor',
      periodDays: 7,
      totalChecks: 50,
      uptime: 100,
    }
    vi.mocked(request).mockResolvedValue({ data: mockData } as any)

    await fetchOverview('mon-123')

    expect(request).toHaveBeenCalledWith({
      url: API_URL.ANALYTICS.OVERVIEW('mon-123', 7),
      schema: analyticsOverviewSchema,
      errorCode: ERROR_CODES.OVERVIEW_ANALYTICS,
      isProtected: true,
    })
  })

  it('should propagate errors from the request utility', async () => {
    const mockError = new Error('Network error')
    vi.mocked(request).mockRejectedValue(mockError)

    await expect(fetchOverview('mon-123')).rejects.toThrow('Network error')

    expect(request).toHaveBeenCalledTimes(1)
  })
})
