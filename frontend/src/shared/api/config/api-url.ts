const DEFAULT_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

const api = (path: string, version: string = DEFAULT_VERSION) => {
  return `/${version}/${path}`
}

const analytics = 'analytics'
const auth = 'auth'
const health = 'health'
const monitors = 'monitors'
const notifications = 'notifications'
const users = 'users'

export const API_URL = {
  ANALYTICS: {
    OVERVIEW: (monitorId: string, days = 7) =>
      api(`${analytics}/overview/${monitorId}?days=${days}`),
    INCIDENTS: (monitorId: string, days = 7) =>
      api(`${analytics}/incidents/${monitorId}?days=${days}`),
    TIMELINE: (monitorId: string, days = 7) =>
      api(`${analytics}/timeline/${monitorId}?days=${days}`),
  },

  AUTH: {
    SIGN_IN_EMAIL: api(`${auth}/sign-in/email`),
    SIGN_UP_EMAIL: api(`${auth}/sign-up/email`),
    SIGN_IN_TELEGRAM: api(`${auth}/telegram`),
    LOGOUT: api(`${auth}/log-out`),
    REFRESH_TOKEN: api(`${auth}/refresh-token`),
  },

  HEALTH: {
    LIVENESS: api(`${health}/liveness`),
    READINESS: api(`${health}/readiness`),
  },

  MONITORS: {
    ALL: api(monitors),
    BY_ID: (monitorId: string) => api(`${monitors}/${monitorId}`),
    CREATE: api(monitors),
    UPDATE: (monitorId: string) => api(`${monitors}/${monitorId}`),
    DELETE: (monitorId: string) => api(`${monitors}/${monitorId}`),
  },

  NOTIFICATIONS: {
    LINK_TELEGRAM: api(`${notifications}/telegram/link-chat`),
    UNLINK_TELEGRAM: api(`${notifications}/telegram/unlink-chat`),
    TOGGLE_ALERT: api(`${notifications}/telegram/toggle-alert`),
    SETTINGS: api(`${notifications}/telegram/settings`),
  },

  USERS: {
    ME: api(`${users}/me`),
    DELETE: api(`${users}/me`),
  },
} as const
