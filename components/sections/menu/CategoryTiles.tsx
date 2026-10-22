"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Category } from "@/lib/db/types";
import { FLAVOUR } from "@/lib/theme";
import { formatPKR } from "@/lib/pricing";
import { Food3D } from "@/components/three/Food3D";
import { ArrowUpRight } from "@/components/ui/Icons";

/** One tile per category → its own page. One per row on phones, 2 on tablets, 3 on desktop. */
export function CategoryTiles({ categories, stats }: { categories: Category[]; stats: Record<string, { count: number; from: number }> }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {categories.map((c, i) => {
        const f = FLAVOUR[c.color];
        const s = stats[c.id] ?? { count: 0, from: 0 };
        return (
          <motion.li key={c.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px 120px 0px" }} transition={{ duration: 0.4, delay: (i % 3) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
            <Link href={`/menu/${c.slug}`} className="focus-ring group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[28px] p-6 transition-shadow duration-500 hover:shadow-card sm:min-h-[320px]" style={{ background: f.lightHex }}>
              <p className="relative z-[25] text-[11px] uppercase tracking-[0.24em] text-espresso/70">{String(i + 1).padStart(2, "0")} · {s.count} items</p>
              <h2 className="h-display relative z-[25] mt-2 max-w-[60%] text-[40px] leading-[0.95] sm:text-5xl">{c.name}</h2>
              <p className="relative z-[25] mt-2 max-w-[55%] text-sm font-light leading-relaxed text-espresso/80">{c.tagline}</p>
              <p className="mt-auto pt-6 text-sm">
                {s.from > 0 && <>from <span className="font-medium">{formatPKR(s.from)}</span></>}
              </p>
              <div className="pointer-events-none absolute -bottom-2 -right-2 aspect-square w-[55%] transition-transform duration-700 ease-expo group-hover:scale-110">
                <Food3D kind={c.art} tint={f.hex} label={`${c.name} — 3D illustration`} />
              </div>
              <span className="absolute right-4 top-4 z-[25] grid h-10 w-10 place-items-center rounded-full bg-white/80 transition-transform duration-500 group-hover:rotate-45"><ArrowUpRight width={16} /></span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
