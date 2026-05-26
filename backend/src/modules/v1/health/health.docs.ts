export const livenessDocs = {
  summary: 'Liveness health check',
  description: "Returns status 200 if the application is running. Doesn't check dependencies",
  okExample: { status: 'OK' },
}

export const readinessDocs = {
  summary: 'Readiness health check',
  description: 'Checks application dependencies',
  okExample: {
    isHealthy: true,
    checks: { database: 'up', redis: 'up' },
    errors: {},
  },
  unavailableExample: {
    isHealthy: false,
    checks: { database: 'up', redis: 'down' },
    errors: { redis: 'Reached the max retries per request limit' },
  },
}
