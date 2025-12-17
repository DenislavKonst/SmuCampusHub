import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres'; // <-- correct for v0.39.x
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Example: postgres://username:password@localhost:5432/dbname',
  );
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle instance for PostgreSQL
export const db = drizzle({
  client: pool,
  schema,
});

// ------------------------------
// Health check
// ------------------------------
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    if (result.rows[0]?.ok === 1) {
      return { connected: true };
    }
    return { connected: false, error: 'Unexpected query result' };
  } catch (error: any) {
    console.error('[DB] Connection check failed:', error.message);
    return { connected: false, error: error.message };
  }
}

// ------------------------------
// Retry initialization
// ------------------------------
export async function initializeDatabase(maxAttempts = 5): Promise<boolean> {
  console.log('[DB] Initializing database connection...');

  let delay = 1000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await checkDatabaseConnection();
    if (result.connected) {
      console.log('[DB] Database connected successfully');
      return true;
    }
    console.log(`[DB] Attempt ${attempt}/${maxAttempts} failed: ${result.error}`);
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }

  console.error('[DB] Failed to connect after all attempts');
  return false;
}
