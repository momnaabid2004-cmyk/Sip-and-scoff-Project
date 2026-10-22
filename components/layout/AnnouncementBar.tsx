"use client";
import { useSite } from "@/components/providers/SiteProvider";

/** Promo strip (editable in Admin → Settings). */
export function AnnouncementBar() {
  const { settings } = useSite();
  if (!settings.announcement) return null;
  return (
    <div className="relative z-[51] bg-espresso px-4 py-2.5 text-center text-[10px] uppercase tracking-[0.12em] text-latte-light sm:text-xs sm:tracking-[0.2em]">
      <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-0.5 animate-pulse rounded-full bg-saffron" aria-hidden="true" />
      {settings.announcement}
    </div>
  );
}
