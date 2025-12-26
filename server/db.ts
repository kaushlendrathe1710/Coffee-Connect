import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL must be set. Please configure NEON_DATABASE_URL or DATABASE_URL.",
  );
}

// Enable SSL for production (required for Neon)
const isProduction = process.env.NODE_ENV === 'production';
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle(pool, { schema });
