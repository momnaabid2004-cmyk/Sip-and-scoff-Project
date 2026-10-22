/**
 * Apply SQL migrations in ./drizzle to the database — `npm run db:migrate`.
 * Uses DIRECT_URL (Supabase session pooler / direct, port 5432) because DDL is not allowed through the transaction pooler.
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DIRECT_URL (or DATABASE_URL) in .env first.");
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  await sql.end();
  console.log("✓ Database is up to date.");
}

main().catch((e) => {
  console.error("Migration failed:", e.message ?? e);
  process.exit(1);
});
