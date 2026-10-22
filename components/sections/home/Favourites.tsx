"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/db/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHead } from "@/components/ui/SectionHead";

/** Featured products. Phones: one card per row, stacked vertically (first 4) · grid of 2/3/4 on larger screens. */
export function Favourites({ products }: { products: Product[] }) {
  return (
    <section className="bg-vanilla-200/60 py-20 sm:py-28" aria-labelledby="fav-title">
      <div className="container-site">
        <SectionHead id="fav-title" eyebrow="House favourites" title={<>What Lahore <em className="text-cherry-600">keeps ordering</em></>} action={<Link href="/menu" className="btn-dark">Order from the menu</Link>} />
      </div>
      <div className="container-site mt-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <motion.div key={p.id} className={i >= 4 ? "hidden sm:block" : undefined} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px 120px 0px" }} transition={{ duration: 0.4, delay: (i % 4) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
              <ProductCard product={p} priority={i < 2} />
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/menu" className="btn-dark w-full">See the full menu</Link>
        </div>
      </div>
    </section>
  );
}
