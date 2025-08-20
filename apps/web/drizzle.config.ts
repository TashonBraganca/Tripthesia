import type { Config } from "drizzle-kit";

export default {
  schema: "../../infra/schema.ts",
  out: "../../infra/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;