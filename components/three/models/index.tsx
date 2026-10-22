"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { ArtKind } from "@/lib/db/types";
import { MotionCtx } from "./common";
import { RoomEnv } from "../env";
import { PourCupModel, CupModel, IcedModel, ChaiGlassModel, MatkaModel, MojitoModel, CanModel, ShakeModel } from "./drinks";
import { ConeModel, SundaeModel, KulfiModel } from "./icecream";
import { SandwichModel, FriesModel, WrapModel, BurgerModel, SamosaModel, NuggetsModel } from "./snacks";
import { CakeModel, BrownieModel, WaffleModel, BowlModel } from "./desserts";

type ModelFC = (p: { tint: string }) => React.ReactElement;

/** kind → model + framing (scale, vertical centre in model units) */
export const MODELS: Record<ArtKind, { C: ModelFC; s: number; cy: number }> = {
  cup: { C: CupModel, s: 1.22, cy: 0.62 },
  iced: { C: IcedModel, s: 1.15, cy: 1.0 },
  "chai-glass": { C: ChaiGlassModel, s: 1.25, cy: 1.05 },
  matka: { C: MatkaModel, s: 1.3, cy: 1.0 },
  cone: { C: ConeModel, s: 1.05, cy: 1.15 },
  sundae: { C: SundaeModel, s: 1.15, cy: 1.05 },
  kulfi: { C: KulfiModel, s: 1.35, cy: 0.85 },
  shake: { C: ShakeModel, s: 1.05, cy: 1.15 },
  mojito: { C: MojitoModel, s: 1.18, cy: 0.88 },
  can: { C: CanModel, s: 1.35, cy: 0.85 },
  sandwich: { C: SandwichModel, s: 1.2, cy: 0.42 },
  fries: { C: FriesModel, s: 1.35, cy: 0.7 },
  wrap: { C: WrapModel, s: 1.45, cy: 0.55 },
  burger: { C: BurgerModel, s: 1.5, cy: 0.5 },
  samosa: { C: SamosaModel, s: 1.25, cy: 0.32 },
  nuggets: { C: NuggetsModel, s: 1.5, cy: 0.35 },
  cake: { C: CakeModel, s: 1.3, cy: 0.45 },
  brownie: { C: BrownieModel, s: 1.25, cy: 0.42 },
  waffle: { C: WaffleModel, s: 1.22, cy: 0.45 },
  bowl: { C: BowlModel, s: 1.6, cy: 0.45 },
};

/** Model leans toward the cursor a little — feels "real" and tactile */
function PointerTilt({ children, amount = 0.25 }: { children: React.ReactNode; amount?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer }, dt) => {
    if (!g.current) return;
    const k = 1 - Math.exp(-dt * 4);
    g.current.rotation.y += (pointer.x * amount - g.current.rotation.y) * k;
    g.current.rotation.x += (-pointer.y * amount * 0.4 - g.current.rotation.x) * k;
  });
  return <group ref={g}>{children}</group>;
}

/**
 * Every model + the exact same lights/environment as a real view, used once by Stage3D to pre-compile
 * all shaders (so a model scrolling into view never causes a compile hitch).
 */
export function WarmupScene() {
  const progress = useRef(0.8);
  const kinds = Object.keys(MODELS) as ArtKind[];
  return (
    <MotionCtx.Provider value={{ still: false, seed: 0 }}>
      <RoomEnv intensity={0.6} />
      <hemisphereLight args={["#FFF4E6", "#7A4A35", 0.5]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#FFF1DE" />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#FFD9C2" />
      {kinds.map((k, i) => {
        const M = MODELS[k].C;
        return (
          <group key={k} position={[(i % 5) * 0.2 - 0.4, 0, -Math.floor(i / 5) * 0.2]} scale={0.3}>
            <M tint="#C9956B" />
          </group>
        );
      })}
      <group scale={0.3}>
        <PourCupModel tint="#8A5A3C" progress={progress} />
      </group>
    </MotionCtx.Provider>
  );
}

/** Everything one food view needs: camera, studio lighting, reflections and the model */
export function FoodScene({ kind, tint, still = false, zoom = 1, seed = 0, progress }: { kind: ArtKind; tint: string; still?: boolean; zoom?: number; seed?: number; progress?: React.MutableRefObject<number> }) {
  // keep the model inside narrow (portrait) boxes: shrink with the aspect ratio
  const aspect = useThree((st) => st.size.width / Math.max(1, st.size.height));
  const fit = Math.min(1, Math.pow(aspect / 0.95, 0.85));
  const m = progress ? { C: (p: { tint: string }) => <PourCupModel tint={p.tint} progress={progress} />, s: 1.15, cy: 1.15 } : MODELS[kind] ?? MODELS.cup;
  return (
    <MotionCtx.Provider value={{ still, seed }}>
      <PerspectiveCamera makeDefault position={[0, 1.15, 6.4]} fov={26} near={0.1} far={40} onUpdate={(c) => c.lookAt(0, 0.05, 0)} />
      <RoomEnv intensity={0.6} />
      <hemisphereLight args={["#FFF4E6", "#7A4A35", 0.5]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#FFF1DE" />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#FFD9C2" />
      <PointerTilt amount={still ? 0 : 0.22}>
        <group scale={m.s * zoom * fit} position-y={-m.cy * m.s * zoom * fit}>
          <m.C tint={tint} />
        </group>
      </PointerTilt>
    </MotionCtx.Provider>
  );
}
