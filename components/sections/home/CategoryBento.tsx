"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { Category } from "@/lib/db/types";
import { FLAVOUR } from "@/lib/theme";
import { Food3D } from "@/components/three/Food3D";
import { SectionHead } from "@/components/ui/SectionHead";
import { ArrowUpRight } from "@/components/ui/Icons";

const MOTION_NOTE: Record<string, string> = { coffee: "steam rising", tea: "freshly poured", icecream: "scooped to order", cold: "ice-cold fizz", shake: "thick & whipped", snack: "hot & crunchy", dessert: "drizzled warm" };

/** Bento of categories — each tile shows its family's 3D model playing its signature animation; tiles link to the category page. */
export function CategoryBento({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  return (
    <section className="container-site py-20 sm:py-28" aria-labelledby="cats-title">
      <SectionHead id="cats-title" eyebrow="The menu, by mood" title={<>Seven ways to <em className="text-cherry-600">treat yourself</em></>} action={<Link href="/menu" className="btn-light">View full menu</Link>} />
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(3,minmax(0,220px))]">
        {categories.map((c, i) => {
          const f = FLAVOUR[c.color];
          const big = i === 0;
          // with 7 categories: 2×2 hero tile + 4 tiles, then the last row's two tiles stretch on desktop
          const wide = categories.length === 7 && i >= 5;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px 120px 0px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(big ? "sm:col-span-2 lg:row-span-2" : "sm:aspect-square lg:aspect-auto", wide && "lg:col-span-2")}
            >
              <Link href={`/menu/${c.slug}`} className={clsx("focus-ring group relative flex h-full min-h-[230px] flex-col justify-between overflow-hidden rounded-[24px] p-4 transition-shadow duration-500 hover:shadow-card sm:rounded-[28px] sm:p-6", big && "min-h-[300px] sm:min-h-[360px]")} style={{ background: f.lightHex }}>
                <div className="relative z-[25]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-espresso/70 sm:text-[11px]">{String(i + 1).padStart(2, "0")} · {counts[c.id] ?? 0} items</p>
                  <h3 className={clsx("h-display mt-2", big ? "text-5xl sm:text-6xl" : "text-[34px] sm:text-4xl")}>{c.name}</h3>
                  {big && <p className="mt-3 max-w-[16rem] font-light text-espresso/80">{c.tagline}</p>}
                </div>
                <div className={clsx("pointer-events-none absolute aspect-square transition-transform duration-700 ease-expo group-hover:scale-110", big ? "-bottom-2 -right-2 w-[64%] sm:w-[58%]" : wide ? "-bottom-2 right-0 w-[52%] sm:w-[66%] lg:right-4 lg:w-[34%]" : "-bottom-2 right-0 w-[52%] sm:w-[66%]")}>
                  <Food3D kind={c.art} tint={f.hex} label={`${c.name} — 3D illustration`} />
                </div>
                <p className="hand relative z-[25] text-xl text-espresso/70 sm:text-2xl">{MOTION_NOTE[f.family] ?? ""}</p>
                <span className="absolute right-3 top-3 z-[25] grid h-10 w-10 place-items-center rounded-full bg-white/80 transition-transform duration-500 group-hover:rotate-45 sm:right-4 sm:top-4"><ArrowUpRight width={16} /></span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
