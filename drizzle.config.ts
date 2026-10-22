import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/** drizzle-kit: `npm run db:generate` creates SQL migrations from lib/db/schema.ts. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "" },
  strict: true,
});
