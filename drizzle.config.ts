import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/database/schema.ts',
  out: './lib/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;