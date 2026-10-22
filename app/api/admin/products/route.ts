import { db } from "@/lib/db";
import { productInput } from "@/lib/db/schemas";
import { collectionRoutes } from "@/lib/crud";
import { productHooks } from "@/lib/hooks-server";

export const { GET, POST } = collectionRoutes(() => db.products, productInput, "products:write", "Product", productHooks);
