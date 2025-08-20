import type { Config } from "drizzle-kit";

// Load environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/tripthesia";

export default {
  schema: "./infra/schema.ts",
  out: "./infra/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;