import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * One connection pool per server instance (re-used across hot reloads in development).
 * `prepare: false` is required by Supabase's transaction pooler (port 6543).
 */
const g = globalThis as unknown as { __sql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your Supabase connection string.");
  return postgres(url, { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 5), idle_timeout: 20, connect_timeout: 15 });
}

const sql = g.__sql ?? connect();
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export const orm = drizzle(sql, { schema, casing: "snake_case" });
export type Orm = typeof orm;
export { schema };
