import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';

const databaseUrl = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Database URL is not defined in environment variables.');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
