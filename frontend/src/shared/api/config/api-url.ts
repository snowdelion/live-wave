const analytics = '/api/analytics'
const auth = '/api/auth'
const health = '/api/health'
const monitor = '/api/monitor'
const notification = '/api/notification'
const users = '/api/users'

export const API_URL = {
  ANALYTICS: {
    OVERVIEW: (monitorId: string, days = 7) => `${analytics}/${monitorId}?days=${days}`,
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

  MONITOR: {
    ALL: monitor,
    BY_ID: (monitorId: string) => `${monitor}/${monitorId}`,
    CREATE: monitor,
    UPDATE: (monitorId: string) => `${monitor}/${monitorId}`,
    DELETE: (monitorId: string) => `${monitor}/${monitorId}`,
  },

  NOTIFICATION: {
    LINK_TELEGRAM: `${notification}/telegram/link-chat`,
    UNLINK_TELEGRAM: `${notification}/telegram/unlink-chat`,
    TOGGLE_ALERT: `${notification}/telegram/toggle-alert`,
    SETTINGS: `${notification}/telegram/settings`,
  },

  USERS: {
    ME: `${users}/me`,
    DELETE: `${users}/me`,
  },
} as const
