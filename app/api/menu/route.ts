import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Public menu (for apps / integrations). */
export async function GET() {
  const [categories, products] = await Promise.all([db.categories.list(), db.products.list()]);
  return NextResponse.json({ categories, products: products.filter((p) => p.available) });
}
