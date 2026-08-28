import { useAuthStore } from '../auth.store'

export function prepareRequest({
  fetchInit,
  body,
  json,
  isProtected,
}: {
  fetchInit: RequestInit | undefined
  body: BodyInit | undefined
  json: unknown | undefined
  isProtected: boolean
}) {
  const headers = new Headers(fetchInit?.headers)
  let finalBody: BodyInit | null = null

  if (json) {
    headers.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(json)
  } else if (body) finalBody = body

  if (isProtected) {
    const accessToken = useAuthStore.getState().accessToken
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return { headers, finalBody }
}
