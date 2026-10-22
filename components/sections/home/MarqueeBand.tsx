import type { Category } from "@/lib/db/types";
import { VelocityMarquee } from "@/components/motion/VelocityMarquee";

/** Category names in a band that speeds up & skews with scroll velocity. */
export function MarqueeBand({ categories }: { categories: Category[] }) {
  return (
    <VelocityMarquee className="overflow-hidden bg-espresso py-5 text-saffron sm:py-7">
      {categories.map((c, i) => (
        <span key={c.id} className="flex items-center gap-8 pr-8 font-display text-3xl sm:gap-12 sm:pr-12 sm:text-5xl">
          <span className={i % 2 ? "italic text-latte-light" : ""}>{c.name}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#C2364A" aria-hidden="true"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12Z" /></svg>
        </span>
      ))}
    </VelocityMarquee>
  );
}
