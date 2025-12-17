import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon (required for serverless)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with connection string
export const pool = new NeonPool({ connectionString: process.env.DATABASE_URL });

// Create drizzle instance
export const db = drizzle({ client: pool, schema });

// Health check function that properly tests the database connection
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const result = await pool.query('SELECT 1 as ok');
    if (result.rows[0]?.ok === 1) {
      return { connected: true };
    }
    return { connected: false, error: 'Unexpected query result' };
  } catch (error: any) {
    console.error('[DB] Connection check failed:', error.message);
    return { connected: false, error: error.message };
  }
}

// Initialize database connection
export async function initializeDatabase(): Promise<boolean> {
  console.log('[DB] Initializing database connection...');
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await checkDatabaseConnection();
    if (result.connected) {
      console.log('[DB] Database connected successfully');
      return true;
    }
    console.log(`[DB] Connection attempt ${attempt}/3 failed: ${result.error}`);
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.error('[DB] Failed to connect after 3 attempts');
  return false;
}
