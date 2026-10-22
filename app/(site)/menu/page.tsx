import type { Metadata } from "next";
import { getSiteData } from "@/lib/site-data";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { CategoryNav } from "@/components/sections/menu/CategoryNav";
import { CategoryTiles } from "@/components/sections/menu/CategoryTiles";
import { ProductBrowser } from "@/components/sections/menu/ProductBrowser";

export const metadata: Metadata = { title: "Menu", description: "Coffee, chai, ice cream, cold drinks, shakes, snacks and desserts — prices in PKR." };

/** Menu overview: pick a category (each has its own page) or search across everything. */
export default async function MenuPage() {
  const { categories, products: all } = await getSiteData();
  const products = all.filter((p) => p.available);
  const stats = Object.fromEntries(
    categories.map((c) => {
      const items = products.filter((p) => p.categoryId === c.id);
      return [c.id, { count: items.length, from: items.length ? Math.min(...items.map((p) => p.price)) : 0 }];
    })
  );
  const bestsellers = products.filter((p) => p.tags.includes("bestseller") || p.featured);

  return (
    <>
      <section className="container-site flex flex-col items-center gap-6 pb-8 pt-12 text-center sm:pt-16 md:flex-row md:items-end md:justify-between md:text-left">
        <div>
          <p className="eyebrow">Full menu · prices in PKR</p>
          <SplitReveal as="h1" by="chars" trigger="load" className="h-display mt-4 text-[clamp(3.6rem,13vw,8.5rem)] leading-[0.88]">
            The <em className="text-cherry-600">menu</em>
          </SplitReveal>
        </div>
        <p className="max-w-sm font-light leading-relaxed text-espresso-muted">Choose a category to see everything in it, or search the whole menu below. Everything is made to order.</p>
      </section>
      <CategoryNav categories={categories} />
      <section className="container-site pb-16 pt-10" aria-label="Categories">
        <CategoryTiles categories={categories} stats={stats} />
      </section>
      <section aria-labelledby="best-h" className="pb-24">
        <ProductBrowser
          products={products}
          idle={bestsellers}
          placeholder="Search the whole menu…"
          title={<h2 id="best-h" className="h-display text-center text-[clamp(2.2rem,5vw,3.6rem)] md:text-left">Bestsellers <em className="text-cherry-600">right now</em></h2>}
        />
      </section>
    </>
  );
}
