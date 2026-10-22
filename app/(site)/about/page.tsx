import type { Metadata } from "next";
import Link from "next/link";
import { getSiteData } from "@/lib/site-data";
import { Food3D } from "@/components/three/Food3D";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { FadeUp } from "@/components/motion/FadeUp";
import { Story } from "@/components/sections/home/Story";
import type { ArtKind } from "@/lib/db/types";

export const metadata: Metadata = { title: "Our story" };

const VALUES: { t: string; d: string; bg: string; art: ArtKind; tint: string }[] = [
  { t: "Lahori at heart", d: "Doodh patti boiled the way it should be, kulfi reduced for hours, bun kebabs with real chutney.", bg: "#F6E6D2", art: "chai-glass", tint: "#C58A55" },
  { t: "Café-quality coffee", d: "Freshly roasted beans, trained baristas and milk steamed to order — no powders, no shortcuts.", bg: "#F1DFCB", art: "cup", tint: "#B9814F" },
  { t: "Small-batch scoops", d: "Ice cream churned in-house with Sindhri mangoes, Belgian chocolate and real pistachio.", bg: "#F8CFCB", art: "sundae", tint: "#F4B3BE" },
  { t: "Fresh & crunchy", d: "Snacks toasted, fried and stacked the moment you order — never sitting under a heat lamp.", bg: "#FCE3A6", art: "fries", tint: "#F2C14E" },
];

/** Our story (edit freely — {cafe} and {city} are filled in from Admin → Settings). */
const STORY = [
  "{cafe} started the way most good things in {city} do — around a table, over too many cups of chai, arguing about whether doodh patti or a flat white is the better way to start the day. We decided we didn't have to choose.",
  "So we built a place that does both properly: a real espresso machine and freshly roasted beans on one side, a dented dhaba kettle and a clay matka on the other, and a freezer full of ice cream we churn ourselves, in small batches, with Sindhri mangoes in summer and roasted pista all year round.",
  "The menu grew the way our regulars asked it to. Students wanted somewhere to study late, so we kept the Wi-Fi fast and the plug points everywhere. Families wanted a calm corner, so we made one. Night owls wanted midnight scoops — and honestly, so did we.",
  "Today we're still the same people behind the counter. We still taste every new chai blend before it goes on the menu, still steam milk to order, and still believe a café should feel like the friend's house you never want to leave. Come for a quick cup — stay for a long gup-shup.",
];

export default async function AboutPage() {
  const { settings, features } = await getSiteData();
  return (
    <>
      <section className="container-site pb-6 pt-12 text-center sm:pt-16">
        <p className="eyebrow">Our story</p>
        <SplitReveal as="h1" by="words" trigger="load" className="h-display mx-auto mt-4 max-w-5xl text-[clamp(2.8rem,8vw,6.5rem)] leading-[0.92]">
          A little corner of <em className="text-cherry-600">{settings.city}</em> that tastes like happiness
        </SplitReveal>
        <FadeUp delay={0.4}><p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-espresso-muted">We brew, scoop and grill from morning till late on {settings.address}. Come for a quick cup, stay for a long gup-shup.</p></FadeUp>
      </section>
      <section className="container-site py-16 sm:py-24" aria-labelledby="began-h">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <FadeUp>
            <div className="relative mx-auto aspect-square w-full max-w-[420px] rounded-[32px] bg-latte-light">
              <div className="absolute inset-[8%]"><Food3D kind="matka" tint="#C58A55" label="A clay matka of chai" /></div>
            </div>
          </FadeUp>
          <div className="text-center lg:text-left">
            <p className="eyebrow">How it began</p>
            <SplitReveal id="began-h" className="h-display mt-4 text-[clamp(2.3rem,5vw,4rem)]">One kettle, one freezer, <em className="text-cherry-600">a lot of chai</em></SplitReveal>
            <div className="mx-auto mt-6 max-w-xl space-y-4 text-[17px] font-light leading-relaxed text-espresso/85 lg:mx-0">
              {STORY.map((para, i) => (
                <FadeUp key={i} delay={i * 0.06}><p>{para.replace(/\{cafe\}/g, settings.cafeName).replace(/\{city\}/g, settings.city)}</p></FadeUp>
              ))}
            </div>
            <p className="hand mt-6 text-2xl text-espresso/70">↳ pull up a chair — the kettle's always on</p>
          </div>
        </div>
      </section>
      <Story features={features.filter((f) => f.active)} cafeName={settings.cafeName} />
      <section className="bg-vanilla-200/60 py-20 sm:py-28" aria-labelledby="values-h">
        <div className="container-site">
          <SplitReveal id="values-h" className="h-display text-center text-[clamp(2.4rem,5.5vw,4.4rem)]">What we <em className="text-cherry-600">care about</em></SplitReveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <FadeUp key={v.t} delay={(i % 2) * 0.1}>
                <div className="group flex h-full flex-col items-center gap-5 rounded-[28px] p-6 text-center sm:flex-row sm:text-left" style={{ background: v.bg }}>
                  <div className="h-36 w-36 shrink-0 transition-transform duration-700 ease-expo group-hover:scale-110"><Food3D kind={v.art} tint={v.tint} /></div>
                  <div>
                    <h3 className="h-display text-3xl">{v.t}</h3>
                    <p className="mt-2 font-light leading-relaxed text-espresso/80">{v.d}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <div className="mt-12 text-center"><Link href="/menu" className="btn-primary">See what we serve</Link></div>
        </div>
      </section>
    </>
  );
}
