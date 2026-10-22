import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const metadata = { title: "Categories" };
export default async function Page() {
  const [categories, products] = await Promise.all([db.categories.list(), db.products.list()]);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.categoryId === c.id).length]));
  return <CategoriesManager initial={categories} counts={counts} />;
}
