import { Prisma } from '@prisma/client'

export function getTrendSql(monitorIds: string[]) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return Prisma.sql`
    WITH numbered AS (
      SELECT
        "monitorId",
        "responseTime",
        ROW_NUMBER() OVER (PARTITION BY "monitorId" ORDER BY "checkedAt") AS rn,
        COUNT(*) OVER (PARTITION BY "monitorId") AS total
      FROM "Check"
      WHERE "checkedAt" >= ${sevenDaysAgo}
        AND "monitorId" IN (${Prisma.join(monitorIds)})
    ),
    stats AS (
      SELECT
        "monitorId",
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS up,
        ROUND(AVG("responseTime")::numeric) AS "avgResponse",
        ROUND(MIN("responseTime")::numeric) AS "minResponse",
        ROUND(MAX("responseTime")::numeric) AS "maxResponse"
      FROM "Check"
      WHERE "checkedAt" >= ${sevenDaysAgo}
        AND "monitorId" IN (${Prisma.join(monitorIds)})
      GROUP BY "monitorId"
    ),
    blocks AS (
      SELECT
        "monitorId",
        CEIL(rn / (total::float / 20)) AS block_num,
        AVG("responseTime") AS avg_response
      FROM numbered
      WHERE "responseTime" IS NOT NULL
      GROUP BY "monitorId", block_num
    ),
    spark AS (
      SELECT
        "monitorId",
        array_agg(ROUND(avg_response::numeric) ORDER BY block_num) AS sparkline
      FROM blocks
      GROUP BY "monitorId"
    )
    SELECT
      s."monitorId",
      s.total,
      s.up,
      s."avgResponse",
      s."minResponse",
      s."maxResponse",
      sp.sparkline
    FROM stats s
    LEFT JOIN spark sp ON s."monitorId" = sp."monitorId"
        `
}

export function getIncidentsCountSql(monitorIds: string[]) {
  return Prisma.sql`
    SELECT "monitorId", COUNT(*) AS count FROM (
      WITH with_prev AS (
        SELECT
          "monitorId",
          status,
          LAG(status) OVER (PARTITION BY "monitorId" ORDER BY "checkedAt") AS prev_status
          FROM "Check"
          WHERE "monitorId" = ANY(${monitorIds}) AND "checkedAt" >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
      )
      SELECT "monitorId", 1
      FROM with_prev
      WHERE status = 'down' AND (prev_status IS NULL OR prev_status != status)
    ) AS down_starts
    GROUP BY "monitorId"`
}
