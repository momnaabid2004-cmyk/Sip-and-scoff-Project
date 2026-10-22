import "server-only";
import { db } from "@/lib/db";

export const productHooks = {
  async validate(data: { categoryId: string }) {
    return (await db.categories.get(data.categoryId)) ? null : "That category no longer exists.";
  },
};
export const categoryHooks = {
  async beforeDelete(id: string) {
    const n = await db.products.countByCategory(id);
    return n ? `Move or delete the ${n} product(s) in this category first.` : null;
  },
};
