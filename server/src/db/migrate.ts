#!/usr/bin/env bun
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import postgres from 'postgres';
import { Database } from 'bun:sqlite';
import * as schema from './schema.js';
import path from 'path';

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';
const DATABASE_URL = process.env.DATABASE_URL || 'sqlite.db';
const migrationsFolder = path.join(import.meta.dir, '../../drizzle');

console.log(`Running migrations for ${DATABASE_TYPE}...`);

try {
  if (DATABASE_TYPE === 'postgres') {
    const sql = postgres(DATABASE_URL, { max: 1 });
    const db = drizzlePg(sql, { schema });
    await migratePg(db, { migrationsFolder });
    await sql.end();
  } else {
    const sqlite = new Database(DATABASE_URL);
    const db = drizzleSqlite(sqlite, { schema });
    await migrate(db, { migrationsFolder });
    sqlite.close();
  }
  console.log('Migrations completed successfully.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
