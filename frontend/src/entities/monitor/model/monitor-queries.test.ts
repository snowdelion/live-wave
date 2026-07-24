import { renderHook, waitFor, act } from '@testing-library/react'

import { createWrapper } from '@/shared/test-utils'

import { createMonitor } from '../api/create-monitor'
import { deleteMonitor } from '../api/delete-monitor'
import type { UserMonitor, UserMonitors } from '../api/dto/user-monitors.dto'
import { fetchDetailedMonitor } from '../api/fetch-detailed-monitor'
import { fetchMonitors } from '../api/fetch-monitors'
import { updateMonitor } from '../api/update-monitor'

import {
  MONITOR_QUERY_KEYS,
  useMonitors,
  useDetailedMonitor,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from './monitor-queries'

// mocks
vi.mock('../api/create-monitor', () => ({ createMonitor: vi.fn() }))
vi.mock('../api/delete-monitor', () => ({ deleteMonitor: vi.fn() }))
vi.mock('../api/fetch-detailed-monitor', () => ({ fetchDetailedMonitor: vi.fn() }))
vi.mock('../api/fetch-monitors', () => ({
  fetchMonitors: vi.fn(),
}))
vi.mock('../api/update-monitor', () => ({ updateMonitor: vi.fn() }))
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return { ...actual, useAuthStore: vi.fn().mockReturnValue('token') }
})

function makeMonitor(overrides: Partial<UserMonitor> = {}): UserMonitor {
  return {
    id: 'mon-1',
    name: 'API Health',
    url: 'https://example.com',
    ...overrides,
  } as UserMonitor
}

// tests
describe('MONITOR_QUERY_KEYS', () => {
  it('builds the "all" key', () => {
    expect(MONITOR_QUERY_KEYS.all).toEqual(['monitors'])
  })

  it('builds the list key', () => {
    expect(MONITOR_QUERY_KEYS.list()).toEqual(['monitors', 'list'])
  })

  it('builds the details key', () => {
    expect(MONITOR_QUERY_KEYS.details()).toEqual(['monitors', 'detail'])
  })

  it('builds a detail key scoped by monitorId', () => {
    expect(MONITOR_QUERY_KEYS.detail('mon-1')).toEqual(['monitors', 'detail', 'mon-1'])
  })

  it('keeps list and detail keys distinct', () => {
    expect(MONITOR_QUERY_KEYS.list()).not.toEqual(MONITOR_QUERY_KEYS.detail('mon-1'))
  })
})

describe('useMonitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls fetchMonitors and returns the list', async () => {
    const mockData = [makeMonitor()]
    vi.mocked(fetchMonitors).mockResolvedValue(mockData as any)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMonitors(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMonitors).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockData)
  })

  it('surfaces errors from fetchMonitors', async () => {
    const error = new Error('failed to list monitors')
    vi.mocked(fetchMonitors).mockRejectedValue(error)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMonitors(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })
})

describe('useDetailedMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls fetchDetailedMonitor with the given id and returns the data', async () => {
    const mockData = makeMonitor({ id: 'mon-42' })
    vi.mocked(fetchDetailedMonitor).mockResolvedValue(mockData as any)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDetailedMonitor('mon-42'), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchDetailedMonitor).toHaveBeenCalledWith('mon-42')
    expect(result.current.data).toEqual(mockData)
  })

  it('is disabled when monitorId is empty', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDetailedMonitor(''), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchDetailedMonitor).not.toHaveBeenCalled()
  })

  it('surfaces errors from fetchDetailedMonitor', async () => {
    const error = new Error('not found')
    vi.mocked(fetchDetailedMonitor).mockRejectedValue(error)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDetailedMonitor('mon-1'), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })
})

describe('useCreateMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createMonitor with the mutation input', async () => {
    const newMonitor = makeMonitor({ id: 'mon-new' })
    vi.mocked(createMonitor).mockResolvedValue(newMonitor as any)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateMonitor(), {
      wrapper: Wrapper,
    })

    const input = { name: 'New Monitor', url: 'https://new.example.com' }
    act(() => {
      result.current.mutate(input as any)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createMonitor).toHaveBeenCalledWith(input, expect.anything())
    expect(result.current.data).toEqual(newMonitor)
  })

  it('invalidates the monitors list on success', async () => {
    vi.mocked(createMonitor).mockResolvedValue(makeMonitor() as any)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateMonitor(), {
      wrapper: Wrapper,
    })

    act(() => {
      result.current.mutate({ name: 'X', url: 'https://x.com' } as any)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MONITOR_QUERY_KEYS.list(),
    })
  })

  it('does not invalidate on failure', async () => {
    const error = new Error('create failed')
    vi.mocked(createMonitor).mockRejectedValue(error)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateMonitor(), {
      wrapper: Wrapper,
    })

    act(() => {
      result.current.mutate({ name: 'X', url: 'https://x.com' } as any)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe('useUpdateMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updateMonitor with monitorId and body', async () => {
    vi.mocked(updateMonitor).mockResolvedValue(makeMonitor({ name: 'Renamed' }) as any)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateMonitor(), {
      wrapper: Wrapper,
    })

    act(() => {
      result.current.mutate({ monitorId: 'mon-1', body: { name: 'Renamed' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateMonitor).toHaveBeenCalledWith('mon-1', { name: 'Renamed' })
  })

  it('optimistically updates the list and detail caches before the mutation resolves', async () => {
    let resolveUpdate: (value: any) => void
    vi.mocked(updateMonitor).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveUpdate = resolve
        }),
    )

    const { Wrapper, queryClient } = createWrapper()
    const existingList = [makeMonitor({ id: 'mon-1', name: 'Old Name' })]
    const existingDetail = makeMonitor({ id: 'mon-1', name: 'Old Name' })

    queryClient.setQueryData(MONITOR_QUERY_KEYS.list(), { monitors: existingList })
    queryClient.setQueryData(MONITOR_QUERY_KEYS.detail('mon-1'), existingDetail)

    const { result } = renderHook(() => useUpdateMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ monitorId: 'mon-1', body: { name: 'New Name' } })
    })

    await waitFor(() => {
      const list = queryClient.getQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list())?.monitors
      expect(list).toBeDefined()
      expect(list?.length).toBeGreaterThan(0)
      expect(list?.[0]?.name).toBe('New Name')
    })

    const detail = queryClient.getQueryData<UserMonitor>(MONITOR_QUERY_KEYS.detail('mon-1'))
    expect(detail?.name).toBe('New Name')

    resolveUpdate!(makeMonitor({ id: 'mon-1', name: 'New Name' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back list and detail caches on error', async () => {
    const error = new Error('update failed')
    vi.mocked(updateMonitor).mockRejectedValue(error)

    const { Wrapper, queryClient } = createWrapper()
    const existingList = [makeMonitor({ id: 'mon-1', name: 'Old Name' })]
    const existingDetail = makeMonitor({ id: 'mon-1', name: 'Old Name' })

    queryClient.setQueryData(MONITOR_QUERY_KEYS.list(), existingList)
    queryClient.setQueryData(MONITOR_QUERY_KEYS.detail('mon-1'), existingDetail)

    const { result } = renderHook(() => useUpdateMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ monitorId: 'mon-1', body: { name: 'New Name' } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const list = queryClient.getQueryData<UserMonitor[]>(MONITOR_QUERY_KEYS.list())
    const detail = queryClient.getQueryData<UserMonitor>(MONITOR_QUERY_KEYS.detail('mon-1'))

    expect(list).toEqual(existingList)
    expect(detail).toEqual(existingDetail)
  })

  it('invalidates list and detail queries on settle (success)', async () => {
    vi.mocked(updateMonitor).mockResolvedValue(makeMonitor() as any)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ monitorId: 'mon-1', body: { name: 'X' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: MONITOR_QUERY_KEYS.list() })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MONITOR_QUERY_KEYS.detail('mon-1'),
    })
  })

  it('invalidates list and detail queries on settle (error)', async () => {
    vi.mocked(updateMonitor).mockRejectedValue(new Error('fail'))

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ monitorId: 'mon-1', body: { name: 'X' } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: MONITOR_QUERY_KEYS.list() })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MONITOR_QUERY_KEYS.detail('mon-1'),
    })
  })

  it('handles a missing previous list gracefully (defaults to empty array)', async () => {
    vi.mocked(updateMonitor).mockResolvedValue(makeMonitor() as any)

    const { Wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => useUpdateMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ monitorId: 'mon-1', body: { name: 'X' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const list = queryClient.getQueryData(MONITOR_QUERY_KEYS.list())
    expect(list).toEqual({ monitors: [], incidentsCount: 0 })
  })
})

describe('useDeleteMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls deleteMonitor with monitorId', async () => {
    vi.mocked(deleteMonitor).mockResolvedValue(undefined as any)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('mon-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleteMonitor).toHaveBeenCalledWith('mon-1')
  })

  it('optimistically removes the monitor from the list cache', async () => {
    let resolveDelete: (value: any) => void
    vi.mocked(deleteMonitor).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveDelete = resolve
        }),
    )

    const { Wrapper, queryClient } = createWrapper()
    const existingList = [makeMonitor({ id: 'mon-1' }), makeMonitor({ id: 'mon-2' })]
    queryClient.setQueryData(MONITOR_QUERY_KEYS.list(), { monitors: existingList })

    const { result } = renderHook(() => useDeleteMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('mon-1')
    })

    await waitFor(() => {
      const list = queryClient.getQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list())?.monitors
      expect(list).toHaveLength(1)
    })

    const list = queryClient.getQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list())?.monitors
    expect(list).toBeDefined()
    expect(list?.length).toBeGreaterThan(0)
    expect(list?.[0]?.id).toBe('mon-2')
    resolveDelete!(undefined)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back the list cache on error', async () => {
    const error = new Error('delete failed')
    vi.mocked(deleteMonitor).mockRejectedValue(error)

    const { Wrapper, queryClient } = createWrapper()
    const existingList = [makeMonitor({ id: 'mon-1' }), makeMonitor({ id: 'mon-2' })]
    queryClient.setQueryData(MONITOR_QUERY_KEYS.list(), existingList)

    const { result } = renderHook(() => useDeleteMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('mon-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const list = queryClient.getQueryData<UserMonitor[]>(MONITOR_QUERY_KEYS.list())
    expect(list).toEqual(existingList)
  })

  it('invalidates list and detail queries on settle', async () => {
    vi.mocked(deleteMonitor).mockResolvedValue(undefined as any)

    const { Wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('mon-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MONITOR_QUERY_KEYS.detail('mon-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: MONITOR_QUERY_KEYS.list() })
  })

  it('handles a missing previous list gracefully (defaults to empty array)', async () => {
    vi.mocked(deleteMonitor).mockResolvedValue(undefined as any)

    const { Wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useDeleteMonitor(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('mon-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const list = queryClient.getQueryData(MONITOR_QUERY_KEYS.list())
    expect(list).toEqual({ monitors: [], incidentsCount: 0 })
  })
})
