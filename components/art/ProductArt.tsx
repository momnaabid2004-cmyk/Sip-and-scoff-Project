import { clsx } from "clsx";
import type { ArtKind } from "@/lib/db/types";
import { FoodArt } from "./FoodArt";

/** Back-compat wrapper (admin + older imports) around the animated FoodArt. */
export function ProductArt({ kind, tint, bg, className, label, still }: { kind: ArtKind; tint?: string; bg?: string; className?: string; label?: string; still?: boolean }) {
  return (
    <div className={clsx("h-full w-full", className)} style={bg ? { background: bg } : undefined}>
      <FoodArt kind={kind} tint={tint} label={label} still={still} />
    </div>
  );
}
