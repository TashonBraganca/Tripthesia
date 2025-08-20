import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../../infra/schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the postgres client
const client = postgres(connectionString, { prepare: false });

// Create the drizzle instance
export const db = drizzle(client, { schema });

// For migrations and manual queries
export { client };

// Export schema for convenience
export * from "../../../infra/schema";