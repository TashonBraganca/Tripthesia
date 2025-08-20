/**
 * Database Client Configuration
 * Drizzle ORM with PostgreSQL + PostGIS
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../../../infra/schema'

// Create the connection string
const connectionString = process.env.DATABASE_URL!

// Create the PostgreSQL connection
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1, // Limit connections for serverless
})

// Create the Drizzle instance
export const db = drizzle(client, { schema })

// Export the client for advanced queries
export { client }

// Re-export schema for convenience
export * from './schema'