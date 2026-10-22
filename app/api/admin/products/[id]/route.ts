import { db } from "@/lib/db";
import { productInput } from "@/lib/db/schemas";
import { itemRoutes } from "@/lib/crud";
import { productHooks } from "@/lib/hooks-server";

export const { GET, PUT, DELETE } = itemRoutes(() => db.products, productInput, "products:write", "Product", productHooks);
