import "server-only";
import type { DataStore } from "./repository";
import { store } from "./store";

/**
 * The single data entry point used by pages and API routes.
 * Backed by PostgreSQL (Supabase) through Drizzle ORM — see lib/db/schema.ts and lib/db/store.ts.
 */
export const db: DataStore = store;
export type { DataStore } from "./repository";
