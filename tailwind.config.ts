import type { Config } from "tailwindcss";

/**
 * "Sweet Roast" palette.
 * Semantic names (espresso, cherry, saffron, mint, latte, blush, butter) are used by the website.
 * Legacy names (cocoa, berry, mango, pista, lagoon, chai, ube) are kept as aliases so the admin panel restyles automatically.
 */
const espresso = { DEFAULT: "#2A1810", 700: "#4A2D20", 500: "#6E4A36", muted: "#6B5446" };
const cherry = { light: "#F8CFCB", DEFAULT: "#D9566A", 600: "#C2364A", 700: "#A52B3E" };
const saffron = { light: "#FCE3A6", DEFAULT: "#F2A93B", 600: "#8A5410" };
const mint = { light: "#D3EDDF", DEFAULT: "#8CC7A6", 600: "#276845" };
const latte = { light: "#F1DFCB", DEFAULT: "#C9956B", 600: "#7A4E2E" };
const peach = { light: "#FBE3D6", DEFAULT: "#E39A7B", 600: "#9C4A2C" };

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vanilla: { 50: "#FFFCF8", DEFAULT: "#FFF7EE", 200: "#F7E9DA", 300: "#F1DFCB" },
        espresso,
        cherry,
        saffron,
        mint,
        latte,
        peach,
        blush: "#F8CFCB",
        butter: "#FCE3A6",
        // legacy aliases (admin panel)
        cocoa: espresso,
        berry: cherry,
        mango: saffron,
        pista: mint,
        lagoon: latte,
        chai: latte,
        ube: peach,
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      boxShadow: {
        card: "0 30px 60px -32px rgba(42,24,16,0.38)",
        soft: "0 18px 40px -24px rgba(42,24,16,0.35)",
        pop: "0 24px 48px -28px rgba(42,24,16,0.45)",
        "pop-sm": "0 12px 28px -18px rgba(42,24,16,0.4)",
        glow: "0 18px 40px -16px rgba(194,54,74,0.55)",
      },
      borderRadius: { arch: "999px 999px 28px 28px", blob: "42% 58% 63% 37% / 41% 44% 56% 59%" },
      maxWidth: { site: "1320px" },
      transitionTimingFunction: { expo: "cubic-bezier(0.16, 1, 0.3, 1)" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        marquee: { to: { transform: "translateX(-50%)" } },
        spin: { to: { transform: "rotate(360deg)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out -3s infinite",
        marquee: "marquee 38s linear infinite",
        "spin-slow": "spin 28s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
