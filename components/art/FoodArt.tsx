"use client";
import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import type { ArtKind } from "@/lib/db/types";

/**
 * Animated food illustration. Every menu family has its own signature motion
 * (CSS keyframes in app/globals.css, transform/opacity only):
 *   coffee → rising steam + latte-art swirl     tea → stream pours & glass fills
 *   ice cream → scoop drops with squash/stretch  cold drinks → fizz, bobbing ice, turning lime
 *   shakes → whipped-cream wobble                 snacks → layers stack, fries jump, crumbs burst
 *   desserts → sauce drizzle & sway
 * Animations pause automatically while the art is off-screen.
 */
type Props = { kind: ArtKind; tint?: string; className?: string; label?: string; still?: boolean };

const INK = "#2A1810";
const CREAM = "#FFF7EE";
const SHADE = "rgba(42,24,16,.12)";

export function FoodArt({ kind, tint = "#C9956B", className, label, still }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? el.setAttribute("data-play", "") : el.removeAttribute("data-play")), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  return (
    <svg ref={ref} viewBox="0 0 200 200" className={clsx("food-art block h-full w-full overflow-visible", className)} role="img" aria-label={label ?? `${kind} illustration`}>
      <ellipse cx="100" cy="182" rx="60" ry="7" fill={SHADE} />
      <Art kind={kind} tint={tint} />
    </svg>
  );
}

function Steam({ x = 100, y = 58, color = "rgba(42,24,16,.28)" }: { x?: number; y?: number; color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round">
      <path className="fa-steam" d={`M${x - 16} ${y} c-8 -10 8 -16 0 -28`} />
      <path className="fa-steam" d={`M${x} ${y - 2} c-8 -10 8 -16 0 -30`} />
      <path className="fa-steam" d={`M${x + 16} ${y} c-8 -10 8 -16 0 -28`} />
    </g>
  );
}

const Fizz = ({ xs, y }: { xs: number[]; y: number }) => (
  <g fill="#FFFFFF" opacity=".85">
    {xs.map((x, i) => (
      <circle key={i} className="fa-fizz" cx={x} cy={y - (i % 3) * 8} r={2 + (i % 3)} />
    ))}
  </g>
);

function Art({ kind, tint }: { kind: ArtKind; tint: string }) {
  switch (kind) {
    /* ---------------- COFFEE ---------------- */
    case "cup":
      return (
        <>
          <Steam y={62} />
          <ellipse cx="100" cy="168" rx="66" ry="11" fill="#F1DFCB" />
          <ellipse cx="100" cy="165" rx="50" ry="7" fill="#E5CDB2" />
          <path d="M140 102c26-2 28 36 0 38" fill="none" stroke="#F1DFCB" strokeWidth="10" strokeLinecap="round" />
          <path d="M42 84h116c0 48-22 78-58 78s-58-30-58-78Z" fill="#FFFFFF" />
          <path d="M42 84h116c0 6-1 12-2 18H44c-1-6-2-12-2-18Z" fill="#F7EEE4" />
          <ellipse cx="100" cy="84" rx="58" ry="14" fill={tint} />
          <ellipse cx="100" cy="84" rx="50" ry="11" fill="#8A5A3C" opacity=".35" />
          {/* latte art, flattened to the cup's perspective, slowly turning */}
          <g transform="translate(100 84) scale(1 .42) translate(-100 -84)">
            <g className="fa-swirl">
              <path d="M100 104c-30-18-26-36-12-34 6 0 10 6 12 10 2-4 6-10 12-10 14-2 18 16-12 34Z" fill={CREAM} />
              <path d="M76 78c10-8 38-8 48 0M82 66c8-6 28-6 36 0" fill="none" stroke={CREAM} strokeWidth="3" strokeLinecap="round" opacity=".85" />
            </g>
          </g>
          <path d="M56 112c4 22 18 38 36 42" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity=".7" strokeLinecap="round" />
        </>
      );
    case "iced":
      return (
        <>
          <g className="fa-bob">
            <rect x="114" y="18" width="7" height="78" rx="3.5" fill="#C2364A" transform="rotate(14 117 57)" />
          </g>
          <path d="M56 58h88l-10 116a8 8 0 0 1-8 7H74a8 8 0 0 1-8-7Z" fill="#FFFFFF" opacity=".55" />
          <g className="fa-fill">
            <path d="M60 92h80l-7 80a7 7 0 0 1-7 6H74a7 7 0 0 1-7-6Z" fill={tint} />
          </g>
          <path d="M60 92h80l-1 10H61Z" fill={CREAM} opacity=".55" />
          <g className="fa-bob"><rect x="74" y="98" width="22" height="22" rx="5" fill="#FFFFFF" opacity=".8" /></g>
          <g className="fa-bob" style={{ animationDelay: "-1.2s" }}><rect x="102" y="112" width="20" height="20" rx="5" fill="#FFFFFF" opacity=".7" /></g>
          <g className="fa-bob" style={{ animationDelay: "-2s" }}><rect x="80" y="132" width="18" height="18" rx="4" fill="#FFFFFF" opacity=".6" /></g>
          <Fizz xs={[78, 92, 108, 120, 86, 114]} y={170} />
          <path d="M66 66c2 40 6 80 10 104" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity=".8" strokeLinecap="round" />
        </>
      );
    /* ---------------- TEA ---------------- */
    case "chai-glass":
      return (
        <>
          {/* kettle spout + pouring stream */}
          <path d="M112 6h46c6 0 8 6 4 10l-22 18h-28Z" fill="#7A4E2E" />
          <path d="M112 34h-12l-6 6" fill="none" stroke="#7A4E2E" strokeWidth="6" strokeLinecap="round" />
          <g className="fa-pour"><rect x="92" y="40" width="7" height="86" rx="3.5" fill={tint} /></g>
          <path d="M60 78h80l-12 96a6 6 0 0 1-6 5H78a6 6 0 0 1-6-5Z" fill="#FFFFFF" opacity=".6" />
          <g className="fa-fill">
            <path d="M63 100h74l-9 72a6 6 0 0 1-6 5H78a6 6 0 0 1-6-5Z" fill={tint} />
          </g>
          <ellipse cx="100" cy="100" rx="37" ry="5" fill={CREAM} opacity=".7" />
          <path d="M66 120h68M68 144h64" stroke="#FFFFFF" strokeWidth="2" opacity=".5" />
          <path d="M60 78h80" stroke="#FFFFFF" strokeWidth="3" />
          <Steam x={120} y={90} />
        </>
      );
    case "matka":
      return (
        <>
          <Steam y={64} />
          <g className="fa-sway">
            <path d="M56 74h88c10 44-2 98-44 100-42-2-54-56-44-100Z" fill="#B5643A" />
            <path d="M56 74h88c1 6 1 12 1 18H55c0-6 0-12 1-18Z" fill="#9C4A2C" />
            <ellipse cx="100" cy="74" rx="44" ry="10" fill={tint} />
            <ellipse cx="100" cy="74" rx="44" ry="10" fill="none" stroke="#9C4A2C" strokeWidth="4" />
            <path d="M62 120c24 8 52 8 76 0M64 144c22 6 50 6 72 0" fill="none" stroke="#9C4A2C" strokeWidth="3" opacity=".6" />
          </g>
        </>
      );
    /* ---------------- ICE CREAM ---------------- */
    case "cone":
      return (
        <>
          <path d="M70 100l30 80 30-80Z" fill="#E8B26A" />
          <path d="M78 116h44M84 134h32M90 152h20M80 104l26 66M120 104l-26 66" stroke="#C98A3E" strokeWidth="2.4" />
          <g className="fa-drop">
            <circle cx="100" cy="80" r="36" fill={tint} />
            <path d="M64 84c6 18 18 10 24 20 6 8 14-6 22 4 8 8 18-6 26-24" fill={tint} />
            <path d="M80 62c8-8 22-10 32-6" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".55" />
            <g className="fa-drip"><path d="M118 100v16a5 5 0 0 1-10 0v-12Z" fill={tint} /></g>
          </g>
          <g>
            {[[84, 64, "#C2364A"], [104, 56, "#8CC7A6"], [116, 74, "#F2A93B"], [92, 84, "#FFFFFF"], [76, 80, "#8CC7A6"]].map(([x, y, c], i) => (
              <rect key={i} className="fa-sprinkle" x={x as number} y={y as number} width="9" height="3.4" rx="1.7" fill={c as string} transform={`rotate(${i * 37} ${(x as number) + 4} ${y as number})`} style={{ animationDelay: `${0.1 * i}s` }} />
            ))}
          </g>
          <circle cx="100" cy="40" r="8" fill="#C2364A" className="fa-drop fa-drop-3" />
        </>
      );
    case "sundae":
      return (
        <>
          <path d="M40 104h120c-4 38-28 56-60 56S44 142 40 104Z" fill="#FFFFFF" opacity=".75" />
          <path d="M88 160h24l4 18H84Z" fill="#FFFFFF" opacity=".8" />
          <g className="fa-drop"><circle cx="76" cy="92" r="26" fill={tint} /></g>
          <g className="fa-drop fa-drop-2"><circle cx="124" cy="92" r="26" fill={CREAM} /></g>
          <g className="fa-drop fa-drop-3"><circle cx="100" cy="68" r="26" fill={tint} /></g>
          <path className="fa-drizzle" d="M60 78c10 18 22 0 34 12 12 12 22-8 34 4 6 6 10 0 14-4" fill="none" stroke="#6E3A22" strokeWidth="6" strokeLinecap="round" />
          <g className="fa-drop fa-drop-3"><circle cx="104" cy="36" r="9" fill="#C2364A" /><path d="M104 27c4-10 10-12 14-12" fill="none" stroke="#2F7A52" strokeWidth="3" strokeLinecap="round" /></g>
        </>
      );
    case "kulfi":
      return (
        <>
          <rect x="93" y="140" width="14" height="42" rx="6" fill="#E8C38A" />
          <g className="fa-sway">
            <path d="M66 52c0-24 68-24 68 0l-6 92c-8 12-48 12-56 0Z" fill={tint} />
            <path d="M70 84c20-6 40 6 60-2" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity=".5" />
            {[[86, 62], [110, 70], [96, 108], [118, 118], [80, 126]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill="#8CC7A6" />
            ))}
            <g className="fa-drip"><path d="M76 138v14a5 5 0 0 1-10 0v-14Z" fill={tint} /></g>
          </g>
        </>
      );
    /* ---------------- SHAKES ---------------- */
    case "shake":
      return (
        <>
          <g className="fa-bob"><rect x="108" y="4" width="8" height="70" rx="4" fill="#8CC7A6" transform="rotate(10 112 40)" /></g>
          <path d="M60 70h80l-10 104a7 7 0 0 1-7 6H77a7 7 0 0 1-7-6Z" fill={tint} />
          <path d="M66 100c22 8 46-8 68 0" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity=".35" />
          <g className="fa-wobble">
            <path d="M54 72c0-26 22-24 30-32 8-12 24-12 32 0 8 8 30 6 30 32Z" fill="#FFFFFF" />
            <path d="M70 58c10-6 22-6 30 0" fill="none" stroke="#F1DFCB" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="30" r="9" fill="#C2364A" className="fa-pop" />
          <path d="M66 78c3 32 7 66 10 92" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity=".5" strokeLinecap="round" />
        </>
      );
    /* ---------------- COLD DRINKS ---------------- */
    case "mojito":
      return (
        <>
          <g className="fa-bob"><rect x="116" y="12" width="7" height="80" rx="3.5" fill="#F2A93B" transform="rotate(14 120 52)" /></g>
          <path d="M58 56h84l-10 118a7 7 0 0 1-7 6H75a7 7 0 0 1-7-6Z" fill="#FFFFFF" opacity=".5" />
          <path d="M61 82h78l-8 90a6 6 0 0 1-6 6H75a6 6 0 0 1-6-6Z" fill={tint} />
          <g className="fa-sway"><path d="M78 118c6-16 22-16 20 2-8 6-16 6-20-2Z" fill="#2F7A52" /></g>
          <g className="fa-sway" style={{ animationDelay: "-1.5s" }}><path d="M104 140c6-14 20-14 18 2-7 5-14 5-18-2Z" fill="#2F7A52" /></g>
          <g className="fa-bob"><rect x="80" y="90" width="18" height="18" rx="4" fill="#FFFFFF" opacity=".7" /></g>
          <Fizz xs={[76, 90, 104, 118, 96, 84, 112]} y={172} />
          <g className="fa-spin">
            <circle cx="140" cy="60" r="20" fill="#D9E87A" />
            <circle cx="140" cy="60" r="15" fill="#EEF5B5" />
            <path d="M140 45v30M125 60h30M129 49l22 22M151 49l-22 22" stroke="#C5D65A" strokeWidth="2" />
          </g>
        </>
      );
    case "can":
      return (
        <>
          <g className="fa-sway">
            <rect x="66" y="40" width="68" height="134" rx="14" fill={tint} />
            <rect x="66" y="40" width="68" height="16" rx="8" fill="#D8D2CB" />
            <rect x="66" y="158" width="68" height="16" rx="8" fill="#D8D2CB" />
            <path d="M80 92c12 18 28 6 40 26" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
            <rect x="74" y="62" width="6" height="90" rx="3" fill="#FFFFFF" opacity=".35" />
            {[[90, 74], [116, 130], [100, 146]].map(([x, y], i) => (
              <g key={i} className="fa-drip" style={{ animationDelay: `${i * 0.9}s` }}><ellipse cx={x} cy={y} rx="2.4" ry="4" fill="#FFFFFF" opacity=".8" /></g>
            ))}
          </g>
          <Fizz xs={[90, 100, 110]} y={36} />
        </>
      );
    /* ---------------- SNACKS ---------------- */
    case "sandwich":
      return (
        <>
          <g className="fa-stack" style={{ animationDelay: "0s" }}><path d="M34 150h132v14a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8Z" fill="#E3B26E" /></g>
          <g className="fa-stack" style={{ animationDelay: ".12s" }}><path d="M40 138c20-8 40 8 60-2 20-8 40 8 60 0v12H40Z" fill="#8CC7A6" /></g>
          <g className="fa-stack" style={{ animationDelay: ".24s" }}><rect x="40" y="124" width="120" height="14" rx="6" fill={tint} /></g>
          <g className="fa-stack" style={{ animationDelay: ".36s" }}><rect x="44" y="112" width="112" height="12" rx="6" fill="#C2364A" /></g>
          <g className="fa-stack" style={{ animationDelay: ".48s" }}><path d="M34 112 100 48l66 64Z" fill="#F3D39C" /><path d="M46 104 100 56l54 48" fill="none" stroke="#E3B26E" strokeWidth="5" strokeLinejoin="round" /></g>
          {[[-18, -14], [16, -18], [24, 4], [-24, 2]].map(([dx, dy], i) => (
            <circle key={i} className="fa-crumb" cx={100 + i * 6} cy="100" r="2.6" fill="#E3B26E" style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px`, animationDelay: ".6s" }} />
          ))}
        </>
      );
    case "fries":
      return (
        <>
          {[62, 76, 90, 104, 118, 132].map((x, i) => (
            <g key={x} className="fa-jump" style={{ animationDelay: `${i * 0.1}s` }}>
              <rect x={x} y={44 + (i % 3) * 10} width="12" height="74" rx="3" fill={tint} transform={`rotate(${(i - 2.5) * 5} ${x + 6} 120)`} />
            </g>
          ))}
          <path d="M50 96h100l-12 82H62Z" fill="#C2364A" />
          <path d="M50 96h100l-2 12H52Z" fill="#A52B3E" />
          <path d="M72 132c14 10 42 10 56 0" fill="none" stroke="#FFF7EE" strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case "wrap":
      return (
        <>
          <Steam y={52} />
          <g className="fa-sway">
            <path d="M62 50l78 18-20 108H82Z" fill={tint} />
            <path d="M64 54c18-14 56-6 76 14-20 4-58-4-76-14Z" fill="#8CC7A6" />
            <path d="M72 56c18 6 40 10 60 12" fill="none" stroke="#C2364A" strokeWidth="5" strokeLinecap="round" />
            <path d="M80 118h40l-2 58H82Z" fill="#FFFFFF" />
            <path d="M84 136h32M86 154h28" stroke="#F1DFCB" strokeWidth="3" />
          </g>
        </>
      );
    case "burger":
      return (
        <>
          <g className="fa-stack" style={{ animationDelay: "0s" }}><path d="M46 140h108c0 26-108 26-108 0Z" fill={tint} /></g>
          <g className="fa-stack" style={{ animationDelay: ".12s" }}><path d="M48 128l12 12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 8 6v6H48Z" fill="#F2A93B" /></g>
          <g className="fa-stack" style={{ animationDelay: ".24s" }}><rect x="44" y="112" width="112" height="18" rx="9" fill="#6E3A22" /></g>
          <g className="fa-stack" style={{ animationDelay: ".36s" }}><path d="M40 108c20-8 40 8 60-2 20-8 40 8 60 0v8H40Z" fill="#8CC7A6" /></g>
          <g className="fa-stack" style={{ animationDelay: ".48s" }}>
            <path d="M46 104c0-48 108-48 108 0Z" fill={tint} />
            {[[76, 78], [100, 70], [124, 80], [90, 90], [112, 92]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="4" ry="2.4" fill={CREAM} />)}
          </g>
        </>
      );
    case "samosa":
      return (
        <>
          <Steam x={100} y={66} />
          <ellipse cx="100" cy="158" rx="76" ry="16" fill="#FFFFFF" />
          <g className="fa-pop"><path d="M46 152 82 76l36 76Z" fill={tint} /><path d="M58 134h46" stroke="#B5643A" strokeWidth="2.6" opacity=".5" /></g>
          <g className="fa-pop" style={{ animationDelay: ".3s" }}><path d="M86 156l38-86 36 86Z" fill={tint} /><path d="M100 136h50" stroke="#B5643A" strokeWidth="2.6" opacity=".5" /></g>
          <g className="fa-wobble"><circle cx="38" cy="146" r="11" fill="#2F7A52" /></g>
          <g className="fa-wobble" style={{ animationDelay: "-1s" }}><circle cx="166" cy="150" r="9" fill="#7A3A1E" /></g>
        </>
      );
    case "nuggets":
      return (
        <>
          <ellipse cx="100" cy="156" rx="76" ry="16" fill="#FFFFFF" />
          {[[66, 136], [100, 128], [134, 138], [82, 108], [118, 106]].map(([x, y], i) => (
            <g key={i} className="fa-pop" style={{ animationDelay: `${i * 0.18}s` }}>
              <path d={`M${x - 22} ${y}c-2-18 40-22 44-4 2 18-40 22-44 4Z`} fill={tint} />
              <path d={`M${x - 12} ${y - 6}c6-4 14-4 20 0`} fill="none" stroke="#FFFFFF" strokeWidth="2.4" opacity=".5" strokeLinecap="round" />
            </g>
          ))}
          <g className="fa-wobble"><ellipse cx="164" cy="104" rx="15" ry="10" fill="#F2A93B" /></g>
        </>
      );
    /* ---------------- DESSERTS ---------------- */
    case "cake":
      return (
        <>
          <ellipse cx="100" cy="168" rx="72" ry="12" fill="#FFFFFF" />
          <g className="fa-sway">
            <path d="M40 112l100-34 20 34v50H40Z" fill="#F7EEE4" />
            <path d="M40 112h120v50H40Z" fill={tint} />
            <path d="M40 132h120" stroke={CREAM} strokeWidth="7" />
            <path d="M40 112l100-34 20 34Z" fill={tint} />
            <path className="fa-drizzle" d="M50 110c6 16 12 0 18 10 6 8 12-8 18 2 6 10 14-6 20 2" fill="none" stroke={CREAM} strokeWidth="5" strokeLinecap="round" />
          </g>
          <g className="fa-drop fa-drop-2"><circle cx="134" cy="72" r="10" fill="#C2364A" /></g>
        </>
      );
    case "brownie":
      return (
        <>
          <ellipse cx="100" cy="166" rx="70" ry="12" fill="#FFFFFF" />
          <g className="fa-pop">
            <path d="M48 98l72-18 34 20v48l-70 16-36-16Z" fill={tint} />
            <path d="M48 98l36 16 70-14M84 114v50" fill="none" stroke="#2A1810" strokeWidth="2" opacity=".25" />
          </g>
          <path className="fa-drizzle" d="M60 96c10 10 20-2 30 6 10 8 20-4 30 2 8 5 16-2 24 0" fill="none" stroke="#F1DFCB" strokeWidth="5" strokeLinecap="round" />
          <g className="fa-drop fa-drop-2"><circle cx="112" cy="70" r="16" fill={CREAM} /></g>
        </>
      );
    case "waffle":
      return (
        <>
          <ellipse cx="100" cy="166" rx="72" ry="12" fill="#FFFFFF" />
          <rect x="42" y="82" width="116" height="76" rx="18" fill={tint} />
          <path d="M71 82v76M100 82v76M129 82v76M42 108h116M42 134h116" stroke="#2A1810" strokeWidth="2.4" opacity=".18" />
          <g className="fa-drop"><circle cx="112" cy="74" r="22" fill={CREAM} /></g>
          <path className="fa-drizzle" d="M56 92c18 22 32-4 50 16 12 12 22-8 38 6" fill="none" stroke="#6E3A22" strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "bowl":
    default:
      return (
        <>
          <Steam y={70} />
          <path d="M34 104h132c-4 46-32 64-66 64S38 150 34 104Z" fill="#FFFFFF" />
          <ellipse cx="100" cy="104" rx="66" ry="14" fill={tint} />
          {[[78, 96], [104, 92], [126, 100], [92, 106]].map(([x, y], i) => (
            <g key={i} className="fa-pop" style={{ animationDelay: `${i * 0.2}s` }}><circle cx={x} cy={y} r="12" fill={tint} /><circle cx={x - 4} cy={y - 4} r="3" fill="#FFFFFF" opacity=".5" /></g>
          ))}
          {[[80, 88], [108, 86], [124, 94]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="4" ry="2.4" fill="#8CC7A6" />)}
        </>
      );
  }
}

/** Which family a kind belongs to — used for labels and themed backgrounds. */
export const ART_FAMILY: Record<ArtKind, "coffee" | "tea" | "icecream" | "cold" | "shake" | "snack" | "dessert"> = {
  cup: "coffee", iced: "cold", "chai-glass": "tea", matka: "tea", cone: "icecream", sundae: "icecream", kulfi: "icecream",
  shake: "shake", mojito: "cold", can: "cold", sandwich: "snack", fries: "snack", wrap: "snack", burger: "snack",
  samosa: "snack", nuggets: "snack", cake: "dessert", brownie: "dessert", waffle: "dessert", bowl: "dessert",
};
