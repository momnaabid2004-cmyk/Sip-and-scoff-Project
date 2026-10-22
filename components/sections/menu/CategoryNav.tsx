import Link from "next/link";
import { clsx } from "clsx";
import type { Category } from "@/lib/db/types";

/** Category links — every category has its own page. Wraps onto multiple lines on phones (nothing hidden off-screen). */
export function CategoryNav({ categories, active }: { categories: Category[]; active?: string }) {
  return (
    <nav aria-label="Menu categories" className="container-site">
      <ul className="flex flex-wrap justify-center gap-2 md:justify-start">
        <li>
          <Link href="/menu" aria-current={!active ? "page" : undefined} className={clsx("focus-ring inline-flex min-h-[44px] items-center rounded-full px-4 text-sm transition-colors", !active ? "bg-espresso text-vanilla" : "border border-espresso/15 hover:border-espresso/40")}>
            All
          </Link>
        </li>
        {categories.map((c) => {
          const on = c.slug === active;
          return (
            <li key={c.id}>
              <Link href={`/menu/${c.slug}`} aria-current={on ? "page" : undefined} className={clsx("focus-ring inline-flex min-h-[44px] items-center rounded-full px-4 text-sm transition-colors", on ? "bg-espresso text-vanilla" : "border border-espresso/15 hover:border-espresso/40")}>
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
