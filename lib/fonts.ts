import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (no runtime Google request, no layout shift).
 * Fraunces is pre-baked at SOFT=100 (the soft, appetising display cut; roman also WONK=0) and subset to Latin,
 * keeping the weight + optical-size axes (+ WONK on the italic): ~160 KB instead of ~270 KB. Rebuild with fontTools if needed:
 *   fonttools varLib.instancer fraunces-latin-full-normal.woff2 SOFT=100 WONK=0 → subset → woff2
 */
export const display = localFont({
  src: [
    { path: "../assets/fonts/fraunces-soft-normal.woff2", style: "normal" },
    { path: "../assets/fonts/fraunces-soft-italic.woff2", style: "italic" },
  ],
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
});
export const sans = localFont({
  src: "../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
export const hand = localFont({
  src: "../node_modules/@fontsource-variable/caveat/files/caveat-latin-wght-normal.woff2",
  variable: "--font-hand",
  weight: "400 700",
  display: "swap",
  preload: false, // decorative notes only — never blocks first paint
});
export const fontVariables = `${display.variable} ${sans.variable} ${hand.variable}`;
