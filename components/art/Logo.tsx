import { clsx } from "clsx";

/** Wordmark: spaced uppercase sans with a soft italic serif ampersand. */
export function Logo({ name = "Sip & Scoop", light, className, size = "md" }: { name?: string; light?: boolean; className?: string; size?: "md" | "lg" }) {
  const [a, b] = name.includes("&") ? name.split("&").map((s) => s.trim()) : [name, ""];
  const t = size === "lg" ? "text-base tracking-[0.36em]" : "text-[13px] tracking-[0.34em] sm:text-[14px]";
  return (
    <span className={clsx("inline-flex items-baseline gap-1.5 whitespace-nowrap font-medium uppercase", light ? "text-vanilla" : "text-espresso", className)}>
      <span className={t}>{a}</span>
      {b && (
        <>
          <span className={clsx("font-display font-normal normal-case italic leading-none", size === "lg" ? "text-4xl" : "text-[26px]", light ? "text-saffron" : "text-cherry-600")}>&amp;</span>
          <span className={t}>{b}</span>
        </>
      )}
    </span>
  );
}

/** Round monogram used in the chat launcher and favicon-sized spots. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={clsx("grid place-items-center rounded-full bg-cherry-600 font-display text-xl italic text-white", className)} aria-hidden="true">
      &amp;
    </span>
  );
}
