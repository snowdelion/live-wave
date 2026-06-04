export async function httpFetch({
  url,
  options = {},
  timeout,
  retries = 3,
}: FetchWithRetryOptions): Promise<Response> {
  if (options.signal?.aborted) throw options.signal.reason
  const maxAttempts = retries + 1
  let lastError: unknown = new Error('Fetch failed without attempts')

  for (let att = 1; att <= maxAttempts; att++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    if (options.signal)
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      const isRetryableStatus =
        (res.status >= 500 && res.status !== 501) || res.status === 408 || res.status === 429

      if (!res.ok && isRetryableStatus && att < maxAttempts)
        throw new Error(`Server error: ${res.status}`)

      return res
    } catch (e) {
      lastError = e
      if (options.signal?.aborted) throw e
      if (att === maxAttempts) break

      const delay = 2 ** (att - 1) * 1000
      await new Promise(res => setTimeout(res, delay))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError
}

export interface FetchWithRetryOptions {
  url: string
  options?: RequestInit
  timeout: number
  retries?: number
}
