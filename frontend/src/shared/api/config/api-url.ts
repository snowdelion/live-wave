const analytics = '/api/analytics'
const auth = '/api/auth'
const health = '/api/health'
const monitors = '/api/monitors'
const notifications = '/api/notifications'
const users = '/api/users'

export const API_URL = {
  ANALYTICS: {
    OVERVIEW: (monitorId: string, days = 7) => `${analytics}/overview/${monitorId}?days=${days}`,
    INCIDENTS: (monitorId: string, days = 7) => `${analytics}/incidents/${monitorId}?days=${days}`,
    TIMELINE: (monitorId: string, days = 7) => `${analytics}/timeline/${monitorId}?days=${days}`,
  },

  AUTH: {
    SIGN_IN_EMAIL: `${auth}/sign-in/email`,
    SIGN_UP_EMAIL: `${auth}/sign-up/email`,
    SIGN_IN_TELEGRAM: `${auth}/telegram`,
    LOGOUT: `${auth}/log-out`,
    REFRESH_TOKEN: `${auth}/refresh-token`,
  },

  HEALTH: {
    LIVENESS: `${health}/liveness`,
    READINESS: `${health}/readiness`,
  },

  MONITORS: {
    ALL: monitors,
    BY_ID: (monitorId: string) => `${monitors}/${monitorId}`,
    CREATE: monitors,
    UPDATE: (monitorId: string) => `${monitors}/${monitorId}`,
    DELETE: (monitorId: string) => `${monitors}/${monitorId}`,
  },

  NOTIFICATIONS: {
    LINK_TELEGRAM: `${notifications}/telegram/link-chat`,
    UNLINK_TELEGRAM: `${notifications}/telegram/unlink-chat`,
    TOGGLE_ALERT: `${notifications}/telegram/toggle-alert`,
    SETTINGS: `${notifications}/telegram/settings`,
  },

  USERS: {
    ME: `${users}/me`,
    DELETE: `${users}/me`,
  },
} as const
