import { Prisma } from '@prisma/client'

export function getUptimeItemSql(monitorId: string, startDate: Date) {
  return Prisma.sql`
    SELECT 
      ROUND((COUNT(*) FILTER (WHERE status = 'up')::float / NULLIF(COUNT(*), 0) * 100)::numeric, 1) AS uptime,
      ROUND(AVG("responseTime") FILTER (WHERE "responseTime" IS NOT NULL), 1) AS "averageResponseTime",
      COUNT(*) AS "totalChecks",
      COUNT(*) FILTER (WHERE status = 'up') AS up,
      COUNT(*) FILTER (WHERE status = 'down') AS down
    FROM "Check"
    WHERE "monitorId" = ${monitorId} AND "checkedAt" >= ${startDate}
  `
}

export function getIncidentsSql(monitorId: string, startDate: Date) {
  return Prisma.sql`
    WITH ranked AS (
      SELECT 
        "checkedAt",
        status,
        error,
        ROW_NUMBER() OVER (ORDER BY "checkedAt", "id") AS rn
      FROM "Check"
      WHERE "monitorId" = ${monitorId} 
        AND "checkedAt" >= ${startDate} 
        AND "checkedAt" <= ${new Date()}
    ),
    changes AS (
      SELECT 
        rn,
        "checkedAt",
        status,
        error,
        CASE 
          WHEN status = 'down' AND (LAG(status) OVER (ORDER BY rn) = 'up' OR LAG(status) OVER (ORDER BY rn) IS NULL) 
            THEN 'start'
          WHEN status = 'up' AND LAG(status) OVER (ORDER BY rn) = 'down'
            THEN 'end'
          ELSE 'none'
        END AS boundary
      FROM ranked
    ),
    starts AS (
      SELECT rn, "checkedAt", error
      FROM changes
      WHERE boundary = 'start'
    ),
    ends AS (
      SELECT rn, "checkedAt"
      FROM changes
      WHERE boundary = 'end'
    )
    SELECT 
      s."checkedAt" AS "startAt",
      e."checkedAt" AS "endAt",
      EXTRACT(EPOCH FROM (e."checkedAt" - s."checkedAt")) * 1000 AS "durationMs",
      s.error AS "cause",
      CASE
        WHEN e."checkedAt" IS NOT NULL THEN 'Resolved'
        ELSE 'Active'
      END AS "status",
      ROW_NUMBER() OVER (ORDER BY s."checkedAt" DESC) AS "id"
    FROM starts s
    LEFT JOIN LATERAL (
      SELECT "checkedAt"
      FROM ends e
      WHERE e.rn > s.rn
      ORDER BY e.rn
      LIMIT 1
    ) e ON true
    ORDER BY s."checkedAt" DESC`
}

export function getIncidentsCountSql(monitorId: string, startDate: Date) {
  return Prisma.sql`
    SELECT COUNT(*) AS count FROM (
      WITH with_prev AS (
        SELECT 
          status,
          LAG(status) OVER (ORDER BY "checkedAt") AS prev_status
        FROM "Check"
        WHERE "monitorId" = ${monitorId} AND "checkedAt" >= ${startDate} AND "checkedAt" <= ${new Date()}
      )
      SELECT 1
      FROM with_prev
      WHERE status = 'down' AND (prev_status IS NULL OR prev_status != status)
    ) AS down_starts`
}

export function getTimelineSql(monitorId: string, startDate: Date, bucketMinutes: number) {
  return Prisma.sql`
    SELECT
      DATE_TRUNC('minute', "checkedAt") - (EXTRACT(MINUTE FROM "checkedAt")::int % ${bucketMinutes}) * INTERVAL '1 minute' AS bucket,
      ROUND(AVG("responseTime") FILTER (WHERE "responseTime" IS NOT NULL), 1) AS "averageResponseTime",
      ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTime")::numeric, 1) AS "p95ResponseTime",
      ROUND((COUNT(*) FILTER (WHERE status = 'up')::float / NULLIF(COUNT(*), 0) * 100)::numeric, 1) AS uptime
    FROM "Check"
    WHERE "monitorId" = ${monitorId} AND "checkedAt" BETWEEN ${startDate} AND ${new Date()}
    GROUP BY bucket
    ORDER BY bucket ASC`
}
