import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { httpFetch } from './http-fetch.utils'

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>

const TEST_URL = 'https://example.com/health'
const TEST_OPTIONS = {
  method: 'GET',
  headers: { Accept: 'application/json' },
} satisfies RequestInit
const TEST_TIMEOUT_MS = 5000

function createMockResponse(status = 200): Response {
  return new Response(null, { status })
}

describe('httpFetch – additional coverage', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('throws immediately if the caller signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort(new DOMException('User cancelled', 'AbortError'))

    await expect(
      httpFetch({
        url: TEST_URL,
        options: { signal: controller.signal },
        timeout: TEST_TIMEOUT_MS,
      }),
    ).rejects.toThrow('User cancelled')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('aborts the in-flight request when the caller signal fires mid-fetch', async () => {
    const externalController = new AbortController()

    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )

    const promise = httpFetch({
      url: TEST_URL,
      options: { signal: externalController.signal },
      timeout: TEST_TIMEOUT_MS,
      retries: 0,
    })

    externalController.abort()

    await expect(promise).rejects.toThrow('Aborted')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    [500, 'Internal Server Error'],
    [502, 'Bad Gateway'],
    [503, 'Service Unavailable'],
    [408, 'Request Timeout'],
    [429, 'Too Many Requests'],
  ])('retries on HTTP %i and returns the eventual success', async status => {
    const okResponse = createMockResponse(200)
    fetchMock.mockResolvedValueOnce(createMockResponse(status)).mockResolvedValueOnce(okResponse)

    const promise = httpFetch({
      url: TEST_URL,
      options: TEST_OPTIONS,
      timeout: TEST_TIMEOUT_MS,
      retries: 1,
    })

    await vi.advanceTimersByTimeAsync(1000)
    await expect(promise).resolves.toBe(okResponse)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry on HTTP 501 (not retryable)', async () => {
    const response501 = createMockResponse(501)
    fetchMock.mockResolvedValueOnce(response501)

    const result = await httpFetch({
      url: TEST_URL,
      options: TEST_OPTIONS,
      timeout: TEST_TIMEOUT_MS,
      retries: 3,
    })

    expect(result).toBe(response501)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns a retryable error response as-is when no retries remain', async () => {
    const response503 = createMockResponse(503)
    fetchMock.mockResolvedValue(response503)

    const promise = httpFetch({
      url: TEST_URL,
      options: TEST_OPTIONS,
      timeout: TEST_TIMEOUT_MS,
      retries: 1,
    })

    await vi.advanceTimersByTimeAsync(1000)
    await expect(promise).resolves.toBe(response503)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('re-throws immediately when the caller signal aborts during a retry', async () => {
    const externalController = new AbortController()
    const abortError = new DOMException('Cancelled during retry', 'AbortError')

    fetchMock.mockImplementationOnce(() => {
      externalController.abort(abortError)
      return Promise.reject(abortError)
    })

    const promise = httpFetch({
      url: TEST_URL,
      options: { signal: externalController.signal },
      timeout: TEST_TIMEOUT_MS,
      retries: 3,
    })

    await expect(promise).rejects.toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
