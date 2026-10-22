/** @type {import('next').NextConfig} */

// Image hosts the Next.js optimiser may fetch from: your Supabase project + any extra CDN hosts (comma-separated).
// Other pasted image URLs still display, but are loaded directly (unoptimised) — see components/art/ProductImage.tsx.
const imageHosts = [
  "*.supabase.co",
  ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
];

const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // Next.js inline bootstrap scripts
  "style-src 'self' 'unsafe-inline'", // framer-motion / GSAP inline styles
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },
  experimental: {
    // tree-shake big animation/3D libraries so each page ships only what it uses
    optimizePackageImports: ["framer-motion", "@react-three/drei", "gsap"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // admin + API responses are private and must never be cached by a CDN or browser
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // fonts & hashed assets are immutable — cache for a year so repeat visits load instantly
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
export default nextConfig;
