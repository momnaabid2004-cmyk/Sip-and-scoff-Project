import { clsx } from "clsx";
import type { ReactNode } from "react";

export function SectionTitle({ eyebrow, title, sub, center, className, id }: { eyebrow?: string; title: ReactNode; sub?: string; center?: boolean; className?: string; id?: string }) {
  return (
    <div className={clsx(center && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="h-display mt-2 text-4xl sm:text-5xl">{title}</h2>
      {sub && <p className="mt-3 text-base leading-relaxed text-cocoa-muted">{sub}</p>}
    </div>
  );
}
