import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { analyticsIncidentsSchema } from '../dto/analytics-incidents.dto'
import { fetchIncidents } from '../fetch-incidents'

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    request: vi.fn(),
  }
})

describe('fetchIncidents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call request with correct parameters and return data', async () => {
    const mockData = { incidents: [], total: 0 }
    vi.mocked(request).mockResolvedValue({ data: mockData } as any)

    const result = await fetchIncidents('mon-123', 14)

    expect(request).toHaveBeenCalledWith({
      url: API_URL.ANALYTICS.INCIDENTS('mon-123', 14),
      schema: analyticsIncidentsSchema,
      errorCode: ERROR_CODES.INCIDENTS_ANALYTICS,
      isProtected: true,
    })

    expect(result).toEqual(mockData)
  })

  it('should use the default days parameter (7) if not provided', async () => {
    const mockData = { incidents: [], total: 0 }
    vi.mocked(request).mockResolvedValue({ data: mockData } as any)

    await fetchIncidents('mon-123')

    expect(request).toHaveBeenCalledWith({
      url: API_URL.ANALYTICS.INCIDENTS('mon-123', 7),
      schema: analyticsIncidentsSchema,
      errorCode: ERROR_CODES.INCIDENTS_ANALYTICS,
      isProtected: true,
    })
  })

  it('should propagate errors from the request utility', async () => {
    const mockError = new Error('Network error')
    vi.mocked(request).mockRejectedValue(mockError)

    await expect(fetchIncidents('mon-123')).rejects.toThrow('Network error')

    expect(request).toHaveBeenCalledTimes(1)
  })
})
