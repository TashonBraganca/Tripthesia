import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './database/schema';

// Type for the database instance
type DatabaseType = ReturnType<typeof drizzle<typeof schema>>;

// Database URL with proper fallbacks
function getDatabaseURL(): string | null {
  const url = process.env.DATABASE_URL;
  
  // Return null if no valid URL during build
  if (!url || url.includes('your_') || url === 'postgresql://build:build@localhost:5432/build') {
    return null;
  }
  
  return url;
}

// Create database client safely
function createDatabaseClient() {
  const connectionString = getDatabaseURL();
  
  if (!connectionString) {
    return null;
  }
  
  try {
    return postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  } catch (error) {
    console.warn('Failed to create database client:', error);
    return null;
  }
}

// Initialize database
const client = createDatabaseClient();
const db = client ? drizzle(client, { schema }) : null;

// Exported database instance
export { db };

// Safe database operations
export async function withDatabase<T>(
  operation: (database: DatabaseType) => Promise<T>
): Promise<T | null> {
  if (!db) {
    console.warn('Database not available');
    return null;
  }
  
  try {
    return await operation(db);
  } catch (error) {
    console.error('Database operation failed:', error);
    return null;
  }
}

// Connection test
export async function testConnection(): Promise<boolean> {
  if (!client || !db) {
    return false;
  }
  
  try {
    await client`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  if (client) {
    try {
      await client.end();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Database availability check
export function isDatabaseAvailable(): boolean {
  return db !== null;
}

// Runtime database requirement check
export function requireDatabase(): DatabaseType {
  if (!db) {
    throw new Error('Database is required but not available');
  }
  return db;
}