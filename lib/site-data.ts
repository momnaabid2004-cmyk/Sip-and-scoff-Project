import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { SITE_TAG } from "@/lib/cache-tags";

/**
 * Everything the public website shows (settings, menu, categories, features) is read ONCE and cached.
 * Every admin change that affects the site calls `refreshSite()` (lib/api.ts), which clears this cache
 * immediately. `revalidate` is a safety net: even if a refresh were ever missed, the site catches up within 5 minutes.
 */
export const getSiteData = unstable_cache(
  async () => {
    const [settings, categories, products, features] = await Promise.all([
      db.settings.get(),
      db.categories.list(),
      db.products.list(),
      db.features.list(),
    ]);
    return { settings, categories, products, features };
  },
  ["site-data"],
  { tags: [SITE_TAG], revalidate: 300 }
);
