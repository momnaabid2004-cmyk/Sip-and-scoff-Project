import { db } from "@/lib/db";
import { categoryInput } from "@/lib/db/schemas";
import { collectionRoutes } from "@/lib/crud";

export const { GET, POST } = collectionRoutes(() => db.categories, categoryInput, "categories:write", "Category");
