import Image from "next/image";
import { clsx } from "clsx";
import type { Product } from "@/lib/db/types";
import { FoodArt } from "./FoodArt";
import { Food3D } from "@/components/three/Food3D";

/**
 * Real photo when the product has one (admin upload / URL). Otherwise:
 *   three=true          → realistic animated 3D model (shared site canvas)
 *   three="standalone"  → 3D model in its own canvas (for overlays such as the product sheet)
 *   default             → the 2D illustration (tiny thumbnails: cart, checkout, admin)
 */
/** Only same-site and Supabase / configured CDN images go through the Next.js optimiser (see next.config.mjs). */
const EXTRA_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
function optimisable(src: string) {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return host.endsWith(".supabase.co") || EXTRA_HOSTS.some((h) => (h.startsWith("*.") ? host.endsWith(h.slice(1)) : host === h));
  } catch {
    return false;
  }
}

export function ProductImage({
  product, bg, className, sizes = "(max-width: 640px) 100vw, 25vw", priority, still, three, zoom,
}: {
  product: Pick<Product, "image" | "art" | "tint" | "name">;
  bg?: string; className?: string; sizes?: string; priority?: boolean; still?: boolean; three?: boolean | "standalone"; zoom?: number;
}) {
  return (
    <div className={clsx("relative overflow-hidden", className)} style={{ background: bg }}>
      {product.image ? (
        <Image src={product.image} alt={product.name} fill sizes={sizes} priority={priority} unoptimized={!optimisable(product.image)} className="object-cover transition-transform duration-700 ease-expo group-hover:scale-105" />
      ) : three ? (
        <div className="absolute inset-0">
          <Food3D kind={product.art} tint={product.tint} label={`${product.name} (3D illustration)`} standalone={three === "standalone"} zoom={zoom} />
        </div>
      ) : (
        <div className="absolute inset-[10%]">
          <FoodArt kind={product.art} tint={product.tint} label={`${product.name} (illustration)`} still={still} />
        </div>
      )}
    </div>
  );
}
