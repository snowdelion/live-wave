import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { analyticsTimelineSchema } from '../dto/analytics-timeline.dto'
import { fetchTimeline } from '../fetch-timeline'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

describe('fetchTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call request with correct parameters and return data', async () => {
    const mockData = [
      { date: '2024-01-01T00:00:00Z', up: 10, down: 0, uptime: 100, averageResponseTime: 120 },
    ]
    vi.mocked(request).mockResolvedValue({ data: mockData } as any)

    const result = await fetchTimeline('mon-123', 30)

    expect(request).toHaveBeenCalledWith({
      url: API_URL.ANALYTICS.TIMELINE('mon-123', 30),
      schema: analyticsTimelineSchema,
      errorCode: ERROR_CODES.TIMELINE_ANALYTICS,
      isProtected: true,
    })

    expect(result).toEqual(mockData)
  })

  it('should use the default days parameter (7) if not provided', async () => {
    const mockData = []
    vi.mocked(request).mockResolvedValue({ data: mockData } as any)

    await fetchTimeline('mon-123')

    expect(request).toHaveBeenCalledWith({
      url: API_URL.ANALYTICS.TIMELINE('mon-123', 7),
      schema: analyticsTimelineSchema,
      errorCode: ERROR_CODES.TIMELINE_ANALYTICS,
      isProtected: true,
    })
  })

  it('should propagate errors from the request utility', async () => {
    const mockError = new Error('Network error')
    vi.mocked(request).mockRejectedValue(mockError)

    await expect(fetchTimeline('mon-123')).rejects.toThrow('Network error')

    expect(request).toHaveBeenCalledTimes(1)
  })
})
