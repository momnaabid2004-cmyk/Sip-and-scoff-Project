"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import type { ArtKind } from "@/lib/db/types";
import { FoodArt } from "@/components/art/FoodArt";
import { useThreeStage } from "./ThreeProvider";

const SharedFoodView = dynamic(() => import("./FoodView").then((m) => m.SharedFoodView), { ssr: false });
const StandaloneFoodView = dynamic(() => import("./FoodView").then((m) => m.StandaloneFoodView), { ssr: false });

type Props = {
  kind: ArtKind;
  tint?: string;
  label?: string;
  className?: string;
  /** render into its own canvas (for overlays above the shared stage) */
  standalone?: boolean;
  /** model scale multiplier */
  zoom?: number;
  /** distance (px) before entering the viewport at which the model mounts */
  margin?: number;
  /** scroll-driven pour (0→1) — renders the espresso-pour scene instead of `kind` */
  progress?: React.MutableRefObject<number>;
};

/**
 * Realistic, animated 3D food model with an accessible 2D fallback.
 * - Mounts only while near the viewport (models replay their intro every time they come into view).
 * - No WebGL → the SVG illustration is shown instead. Reduced motion → model is shown at rest.
 */
export function Food3D({ kind, tint = "#C9956B", label, className, standalone, zoom, margin = 160, progress }: Props) {
  const { ready, reduced } = useThreeStage();
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [seed] = useState(() => Math.random());

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: `${margin}px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [ready, margin]);

  const show3D = ready && near;
  return (
    <div ref={ref} className={clsx("relative h-full w-full", className)} role="img" aria-label={label ?? `${kind} — 3D illustration`}>
      {!ready && <FoodArt kind={kind} tint={tint} still label={label} className="absolute inset-[8%] !h-[84%] !w-[84%]" />}
      {show3D &&
        (standalone ? (
          <StandaloneFoodView kind={kind} tint={tint} still={reduced} zoom={zoom} seed={seed} progress={progress} />
        ) : (
          <SharedFoodView kind={kind} tint={tint} still={reduced} zoom={zoom} seed={seed} progress={progress} />
        ))}
    </div>
  );
}
