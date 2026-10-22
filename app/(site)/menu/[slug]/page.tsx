import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteData } from "@/lib/site-data";
import { FLAVOUR } from "@/lib/theme";
import { formatPKR } from "@/lib/pricing";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Food3D } from "@/components/three/Food3D";
import { CategoryNav } from "@/components/sections/menu/CategoryNav";
import { ProductBrowser } from "@/components/sections/menu/ProductBrowser";
import { ArrowRight } from "@/components/ui/Icons";

type Params = Promise<{ slug: string }>;

/** Pre-render every category page at build time; new categories are rendered on first visit. */
export async function generateStaticParams() {
  return (await getSiteData()).categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getSiteData()).categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Menu" };
  return { title: `${cat.name} — Menu`, description: `${cat.tagline} See every ${cat.name.toLowerCase()} item with prices in PKR.` };
}

/** One page per category: /menu/coffee, /menu/chai, /menu/ice-cream, /menu/snacks … */
export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { categories, products: all } = await getSiteData();
  const index = categories.findIndex((c) => c.slug === slug);
  if (index < 0) notFound();
  const cat = categories[index];
  const f = FLAVOUR[cat.color];
  const products = all.filter((p) => p.available && p.categoryId === cat.id);
  const from = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const next = categories[(index + 1) % categories.length];
  const prev = categories[(index - 1 + categories.length) % categories.length];

  return (
    <>
      <section className="container-site pt-6 sm:pt-10" aria-labelledby="cat-title">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs uppercase tracking-[0.2em] text-espresso-muted">
          <Link href="/menu" className="hover:text-espresso">Menu</Link> <span aria-hidden="true">/</span> <span className="text-espresso">{cat.name}</span>
        </nav>
        <div className="relative grid overflow-hidden rounded-[32px] md:grid-cols-[1.1fr_1fr]" style={{ background: f.lightHex }}>
          <div className="relative z-10 p-7 text-center sm:p-10 md:text-left lg:p-14">
            <p className="eyebrow">{String(index + 1).padStart(2, "0")} · {products.length} items{from ? ` · from ${formatPKR(from)}` : ""}</p>
            <SplitReveal as="h1" id="cat-title" by="chars" trigger="load" className="h-display mt-4 text-[clamp(3.2rem,11vw,7.5rem)] leading-[0.9]">
              {cat.name}
            </SplitReveal>
            <p className="mx-auto mt-4 max-w-md text-[17px] font-light leading-relaxed text-espresso/80 md:mx-0">{cat.tagline}</p>
            <p className="hand mt-4 text-2xl text-espresso/70">↳ tap any item to customise it</p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[460px] md:aspect-[6/5] md:max-w-none">
            <Food3D kind={cat.art} tint={f.hex} label={`${cat.name} — 3D illustration`} zoom={0.92} margin={400} />
          </div>
        </div>
      </section>
      <div className="py-8">
        <CategoryNav categories={categories} active={cat.slug} />
      </div>
      <ProductBrowser products={products} placeholder={`Search ${cat.name.toLowerCase()}…`} />
      <nav aria-label="More categories" className="container-site grid grid-cols-1 gap-4 py-16 sm:grid-cols-2 sm:py-24">
        <Link href={`/menu/${prev.slug}`} className="focus-ring group rounded-[28px] p-6 transition-shadow hover:shadow-card" style={{ background: FLAVOUR[prev.color].lightHex }}>
          <span className="text-[11px] uppercase tracking-[0.24em] text-espresso/70">← Previous</span>
          <span className="h-display mt-2 block text-4xl">{prev.name}</span>
        </Link>
        <Link href={`/menu/${next.slug}`} className="focus-ring group rounded-[28px] p-6 text-right transition-shadow hover:shadow-card" style={{ background: FLAVOUR[next.color].lightHex }}>
          <span className="text-[11px] uppercase tracking-[0.24em] text-espresso/70">Next →</span>
          <span className="h-display mt-2 flex items-center justify-end gap-3 text-4xl">{next.name} <ArrowRight width={22} className="transition-transform group-hover:translate-x-1" /></span>
        </Link>
      </nav>
    </>
  );
}
