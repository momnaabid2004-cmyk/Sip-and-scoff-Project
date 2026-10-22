import { db } from "@/lib/db";
import { categoryInput } from "@/lib/db/schemas";
import { itemRoutes } from "@/lib/crud";
import { categoryHooks } from "@/lib/hooks-server";

export const { GET, PUT, DELETE } = itemRoutes(() => db.categories, categoryInput, "categories:write", "Category", categoryHooks);
