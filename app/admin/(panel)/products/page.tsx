import { Suspense } from "react";
import { db } from "@/lib/db";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const metadata = { title: "Products" };
export default async function Page() {
  const [products, categories] = await Promise.all([db.products.list(), db.categories.list()]);
  return <Suspense><ProductsManager initial={products} categories={categories} /></Suspense>;
}
