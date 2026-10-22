import { getSiteData } from "@/lib/site-data";
import { Hero } from "@/components/sections/home/Hero";
import { MarqueeBand } from "@/components/sections/home/MarqueeBand";
import { CategoryBento } from "@/components/sections/home/CategoryBento";
import { Favourites } from "@/components/sections/home/Favourites";
import { PourScene } from "@/components/sections/home/PourScene";
import { Story } from "@/components/sections/home/Story";
import { DayTimeline, type Slot } from "@/components/sections/home/DayTimeline";
import { Concierge } from "@/components/sections/home/Concierge";
import { Visit } from "@/components/sections/home/Visit";
import { Newsletter } from "@/components/sections/home/Newsletter";

export default async function HomePage() {
  const { categories, products: all, features, settings } = await getSiteData();
  const products = all.filter((p) => p.available);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.categoryId === c.id).length]));
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured && p.tags.includes("bestseller"))];
  // categories are looked up by slug, so the page keeps working when an admin recreates a category
  const catId = (slug: string) => categories.find((c) => c.slug === slug)?.id;
  const pick = (slug: string) => {
    const id = catId(slug);
    return products.find((p) => p.categoryId === id && p.featured) ?? products.find((p) => p.categoryId === id);
  };
  // live examples for the AI demo chat — prices always match the menu
  const coldIds = ["cold-drinks", "shakes"].map(catId);
  const cold = products.filter((p) => coldIds.includes(p.categoryId) && p.price <= 500).sort((a, b) => Number(b.tags.includes("bestseller")) - Number(a.tags.includes("bestseller")));

  const slots: Slot[] = [
    { time: "9 AM", title: "Wake-up call", text: "A Spanish latte or proper doodh patti before class or work.", bg: "#F1DFCB", product: pick("coffee") },
    { time: "1 PM", title: "Lunch break", text: "Club sandwich, masala fries and something ice-cold.", bg: "#FCE3A6", product: pick("snacks") },
    { time: "5 PM", title: "Chai o'clock", text: "Kashmiri chai with samosas — the most Lahori hour.", bg: "#F6E6D2", product: pick("chai") },
    { time: "8 PM", title: "Family night", text: "Thick shakes for the kids, coolers for everyone.", bg: "#FBE3D6", product: pick("shakes") },
    { time: "11 PM", title: "Midnight scoops", text: "A brownie sundae or molten lava cake. No judgement.", bg: "#F8CFCB", product: pick("ice-cream") },
  ];

  return (
    <>
      <Hero featured={featured.find((p) => p.categoryId === catId("coffee")) ?? featured[0]} itemCount={products.length} />
      <MarqueeBand categories={categories} />
      <CategoryBento categories={categories} counts={counts} />
      <Favourites products={featured} />
      <PourScene />
      <Story features={features.filter((f) => f.active)} cafeName={settings.cafeName} />
      <DayTimeline slots={slots} />
      <Concierge picks={cold.slice(0, 2).map((p) => ({ name: p.name, price: p.price }))} />
      <Visit settings={settings} />
      <Newsletter />
    </>
  );
}
