import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(process.cwd(), '.env.local') })

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
