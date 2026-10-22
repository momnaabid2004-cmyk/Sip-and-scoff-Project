"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import type { Product, ProductTag } from "@/lib/db/types";
import { TAG_LABEL } from "@/lib/theme";
import { ProductCard } from "@/components/ui/ProductCard";
import { SearchIcon, CloseIcon } from "@/components/ui/Icons";

const FILTERS: ProductTag[] = ["bestseller", "veg", "spicy", "low-caffeine", "seasonal", "new"];
type Sort = "popular" | "low" | "high";

/**
 * Search + sort + dietary filters + product grid.
 * Phones: one card per row, stacked vertically · tablets: 2 · laptops: 3 · large screens: 4.
 * `idle` (optional) is shown instead of `products` while nothing is searched or filtered.
 */
export function ProductBrowser({ products, idle, placeholder = "Search chai, kulfi, fries…", title, filters = FILTERS }: { products: Product[]; idle?: Product[]; placeholder?: string; title?: React.ReactNode; filters?: ProductTag[] }) {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [sort, setSort] = useState<Sort>("popular");
  const searching = q.trim().length > 0 || tags.length > 0;
  // only offer filters that would match something here
  const usable = useMemo(() => filters.filter((t) => products.some((p) => p.tags.includes(t))), [filters, products]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = !searching && idle ? idle : products;
    let out = base.filter((p) => (!term || `${p.name} ${p.description}`.toLowerCase().includes(term)) && tags.every((t) => p.tags.includes(t)));
    if (sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "popular") out = [...out].sort((a, b) => Number(b.tags.includes("bestseller")) - Number(a.tags.includes("bestseller")) || a.sortOrder - b.sortOrder);
    return out;
  }, [products, idle, q, tags, sort, searching]);

  return (
    <div>
      <div className="sticky top-[68px] z-30 border-y border-espresso/10 bg-vanilla lg:top-[80px]">
        <div className="container-site flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="flex gap-2 lg:w-[380px] lg:shrink-0">
            <label className="relative flex-1">
              <span className="sr-only">Search</span>
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-espresso-muted" width={17} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="input !rounded-full !pl-11 !pr-10" />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-espresso/5" aria-label="Clear search">
                  <CloseIcon width={14} />
                </button>
              )}
            </label>
            <label className="shrink-0">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !w-auto !rounded-full !pr-8">
                <option value="popular">Popular</option>
                <option value="low">Price ↑</option>
                <option value="high">Price ↓</option>
              </select>
            </label>
          </div>
          {usable.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Filters">
              {usable.map((t) => {
                const on = tags.includes(t);
                return (
                  <button key={t} aria-pressed={on} onClick={() => setTags((p) => (on ? p.filter((x) => x !== t) : [...p, t]))} className={clsx("focus-ring min-h-[36px] rounded-full px-3.5 text-xs uppercase tracking-[0.14em] transition-colors", on ? "bg-cherry-600 text-white" : "bg-white text-espresso hover:bg-latte-light")}>
                    {TAG_LABEL[t]}
                  </button>
                );
              })}
              {searching && (
                <button onClick={() => { setTags([]); setQ(""); }} className="min-h-[36px] px-2 text-xs uppercase tracking-[0.14em] text-cherry-600 underline underline-offset-4">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container-site pt-10 sm:pt-12">
        {title && !searching && <div className="mb-6">{title}</div>}
        {searching && <p className="mb-6 text-sm text-espresso-muted" aria-live="polite">{list.length} {list.length === 1 ? "item" : "items"} found</p>}
        <AnimatePresence mode="wait" initial={false}>
          {list.length ? (
            <motion.ul key="grid" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((p, i) => (
                <motion.li key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px 120px 0px" }} transition={{ duration: 0.4, delay: (i % 4) * 0.03, ease: [0.16, 1, 0.3, 1] }}>
                  <ProductCard product={p} priority={i < 2} />
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[24px] border border-dashed border-espresso/20 p-8 text-center font-light text-espresso-muted">
              Nothing here matches your search or filters.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
