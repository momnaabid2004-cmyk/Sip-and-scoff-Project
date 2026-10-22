"use client";
import Link from "next/link";
import { Logo } from "@/components/art/Logo";
import { useSite } from "@/components/providers/SiteProvider";
import { useLenis } from "@/components/providers/SmoothScroll";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowUpRight, FacebookIcon, InstagramIcon, TiktokIcon } from "@/components/ui/Icons";

/** Footer — every column, link and button is centred on phones, left-aligned from md up. */
export function Footer() {
  const { settings: s, categories } = useSite();
  const { scrollTo } = useLenis();
  const wa = `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`;
  const [a, b] = s.cafeName.includes("&") ? s.cafeName.split("&").map((x) => x.trim()) : [s.cafeName, ""];

  return (
    <footer className="relative overflow-hidden bg-espresso pb-28 pt-20 text-latte-light sm:pb-10 sm:pt-24" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">Footer</h2>
      <div className="container-site grid gap-12 text-center sm:grid-cols-2 md:text-left lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col items-center md:items-start">
          <Logo name={s.cafeName} light />
          <p className="mt-5 max-w-xs text-sm font-light leading-relaxed text-latte-light/80">{s.tagline}</p>
          <div className="mt-6 flex justify-center gap-2.5 md:justify-start">
            {[
              { href: s.socials.instagram, Icon: InstagramIcon, label: "Instagram" },
              { href: s.socials.facebook, Icon: FacebookIcon, label: "Facebook" },
              { href: s.socials.tiktok, Icon: TiktokIcon, label: "TikTok" },
            ].map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-latte-light/25 transition-colors hover:border-saffron hover:text-saffron">
                <Icon width={18} />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Menu categories" className="flex flex-col items-center md:items-start">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-saffron">Menu</h3>
          <ul className="mt-5 space-y-3 text-[15px]">
            {categories.map((c) => (
              <li key={c.id}><Link href={`/menu/${c.slug}`} className="text-latte-light/85 transition-colors hover:text-white">{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-saffron">Hours</h3>
          <ul className="mt-5 space-y-3 text-[15px]">
            {s.hours.map((h) => (
              <li key={h.days} className="flex flex-col items-center md:items-start"><span className="text-white">{h.days}</span><span className="text-latte-light/75">{h.time}</span></li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-saffron">Visit</h3>
          <address className="mt-5 space-y-2 text-[15px] not-italic text-latte-light/85">
            <p>{s.address}, {s.city}</p>
            <p><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-white">{s.phone}</a></p>
            <p><a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a></p>
          </address>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-saffron">Order on WhatsApp</a>
            <Link href="/menu" className="btn border border-latte-light/30 text-latte-light hover:bg-latte-light hover:text-espresso">View menu</Link>
          </div>
        </div>
      </div>

      <SplitReveal as="p" by="chars" className="mt-16 select-none whitespace-nowrap text-center font-display text-[17vw] leading-[0.85] text-saffron/15 lg:mt-20" aria-hidden="true">
        {a} <span className="italic">&amp;</span> {b}
      </SplitReveal>

      <div className="container-site mt-8 flex flex-col items-center justify-between gap-4 border-t border-latte-light/15 pt-6 text-center text-xs text-latte-light/70 md:flex-row md:text-left">
        <p>© {new Date().getFullYear()} {s.cafeName}. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link href="/track" className="hover:text-white">Track order</Link>
          <Link href="/about" className="hover:text-white">Our story</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/admin" className="hover:text-white">Staff login</Link>
          <button onClick={() => scrollTo(0)} className="focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-latte-light/25 px-4 hover:border-white hover:text-white">Back to top <ArrowUpRight width={12} className="-rotate-45" /></button>
        </div>
      </div>
    </footer>
  );
}
