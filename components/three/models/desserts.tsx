"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { BlobShadow, Ceramic, Cherry, Cream, Glossy, Matte, drop, easeBack, easeOut, shade, useClock, useLathe, useScoopGeometry } from "./common";
import { crumbTex, gridTex } from "../textures";

const PERIOD = 7;

function useSway(speed = 0.4, amp = 0.55) {
  const g = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    if (g.current) {
      const intro = easeBack(t / 1.0);
      g.current.rotation.y = -0.6 + Math.sin(t * speed) * amp;
      g.current.scale.setScalar(0.5 + 0.5 * intro);
    }
  });
  return g;
}

/** Sauce that streams from above, then pools and runs down the sides */
function Drizzle({ y, color = "#4A2412", r = 0.3, drips = 5, delay = 0.9 }: { y: number; color?: string; r?: number; drips?: number; delay?: number }) {
  const stream = useRef<THREE.Mesh>(null);
  const pool = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const p = clock(c.elapsedTime) % PERIOD;
    const out = p > PERIOD - 0.5 ? 1 - easeOut((p - (PERIOD - 0.5)) / 0.5) : 1;
    if (stream.current) {
      const on = p > delay && p < delay + 1.4 ? Math.min(1, (p - delay) / 0.2, (delay + 1.4 - p) / 0.25) : 0;
      stream.current.visible = on > 0.01;
      stream.current.scale.set(on, 1, on);
    }
    if (pool.current) {
      const k = easeOut((p - delay - 0.2) / 1.4) * out;
      pool.current.scale.set(Math.max(0.001, k), Math.max(0.001, k), Math.max(0.001, k));
      pool.current.visible = k > 0.01;
    }
  });
  return (
    <group position-y={y}>
      <mesh ref={stream} position-y={0.9}>
        <cylinderGeometry args={[0.025, 0.035, 1.8, 10]} />
        <Glossy color={color} rough={0.08} />
      </mesh>
      <group ref={pool}>
        <mesh scale={[1, 0.18, 1]}>
          <sphereGeometry args={[r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Glossy color={color} rough={0.08} />
        </mesh>
        {Array.from({ length: drips }, (_, i) => {
          const a = (i / drips) * Math.PI * 2 + 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.95, -0.08 - (i % 2) * 0.05, Math.sin(a) * r * 0.95]}>
              <capsuleGeometry args={[0.028, 0.12 + (i % 3) * 0.05, 4, 8]} />
              <Glossy color={color} rough={0.08} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Plate({ r = 1 }: { r?: number }) {
  const geo = useLathe(useMemo<[number, number][]>(() => [[0, 0], [r * 0.55, 0], [r * 0.6, 0.03], [r * 0.95, 0.06], [r, 0.1], [r * 0.97, 0.11], [r * 0.6, 0.06], [0, 0.05]], [r]));
  return (
    <mesh geometry={geo}>
      <Ceramic />
    </mesh>
  );
}

const layerCache = new Map<string, THREE.Texture>();
/** cut face of the slice: sponge / cream / sponge / glaze */
function layersTex(tint: string) {
  const hit = layerCache.get(tint);
  if (hit) return hit;
  const s = 256, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const bands: [string, number][] = [[shade(tint, -0.1), 0.16], ["#FFF4E4", 0.1], [tint, 0.3], ["#FFF4E4", 0.1], [tint, 0.34]];
  let y = 0;
  bands.forEach(([col, h]) => {
    g.fillStyle = col;
    g.fillRect(0, y, s, h * s + 1);
    y += h * s;
  });
  for (let i = 0; i < 700; i++) {
    const yy = Math.random() * s;
    if (yy < 0.16 * s || (yy > 0.26 * s && yy < 0.56 * s) || (yy > 0.66 * s)) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.12)";
      g.beginPath();
      g.arc(Math.random() * s, yy, Math.random() * 2.4 + 0.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  layerCache.set(tint, t);
  return t;
}

/** Layered cake slice — cut faces show sponge & cream, glossy glaze, a cherry that bounces into place */
export function CakeModel({ tint }: { tint: string }) {
  const R = 0.95, H = 0.62, T0 = 0.15, TL = 0.95;
  const layers = useMemo(() => layersTex(tint), [tint]);
  const face = useMemo(() => {
    const g = new THREE.PlaneGeometry(R, H);
    g.translate(R / 2, H / 2, 0);
    return g;
  }, []);
  const g = useSway(0.4, 0.45);
  const berry = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const p = clock(c.elapsedTime) % PERIOD;
    if (berry.current) {
      const d = drop((p - 0.4) / 0.9, 1.4);
      berry.current.position.y = H + 0.24 + d.y;
      berry.current.scale.set(d.sx, d.sy, d.sx);
      berry.current.visible = p > 0.4;
    }
  });
  const mid = T0 + TL / 2;
  return (
    <group>
      <BlobShadow size={2.4} />
      <group ref={g}>
        <Plate r={1.05} />
        <group position-y={0.08} rotation-y={-mid + Math.PI + 0.45}>
          {/* body (outer arc + caps) */}
          <mesh position-y={H / 2}>
            <cylinderGeometry args={[R, R, H, 32, 1, false, T0, TL]} />
            <meshStandardMaterial color={shade(tint, -0.05)} roughness={0.75} />
          </mesh>
          {/* glossy glaze on top + rim */}
          <mesh position-y={H + 0.02}>
            <cylinderGeometry args={[R + 0.01, R + 0.01, 0.05, 32, 1, false, T0, TL]} />
            <Glossy color={shade(tint, -0.12)} rough={0.1} />
          </mesh>
          {/* cut faces with layers */}
          {[T0, T0 + TL].map((th, i) => (
            <mesh key={i} geometry={face} rotation-y={th - Math.PI / 2}>
              <meshStandardMaterial map={layers} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <group rotation-y={mid - Math.PI / 2}>
            {[0.35, 0.6, 0.82].map((r, i) => (
              <mesh key={i} position={[r, H + 0.07, 0]}>
                <sphereGeometry args={[0.06, 14, 10]} />
                <Cream color="#FFF4E4" />
              </mesh>
            ))}
            <group ref={berry} position={[0.6, H + 0.24, 0]}>
              <Cherry r={0.09} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Stacked fudge brownies with hot chocolate drizzle */
export function BrownieModel({ tint }: { tint: string }) {
  const crumb = useMemo(() => crumbTex(tint, "rgba(20,8,4,0.5)", `brownie-${tint}`), [tint]);
  const g = useSway(0.35, 0.5);
  const pieces: { p: [number, number, number]; r: number }[] = [
    { p: [-0.25, 0.2, 0.05], r: 0.2 },
    { p: [0.28, 0.2, -0.05], r: -0.25 },
    { p: [0.02, 0.52, 0], r: 0.6 },
  ];
  return (
    <group>
      <BlobShadow size={2.4} />
      <group ref={g}>
        <Plate r={1} />
        {pieces.map((pc, i) => (
          <RoundedBox key={i} args={[0.55, 0.3, 0.55]} radius={0.05} smoothness={3} position={pc.p} rotation-y={pc.r}>
            <meshStandardMaterial map={crumb} bumpMap={crumb} bumpScale={2.5} roughness={0.7} />
          </RoundedBox>
        ))}
        <Drizzle y={0.68} r={0.24} />
        <mesh position={[0.02, 0.73, 0]}>
          <boxGeometry args={[0.09, 0.03, 0.09]} />
          <Matte color="#6DA544" />
        </mesh>
      </group>
    </group>
  );
}

/** Belgian waffle with a vanilla scoop and chocolate sauce */
export function WaffleModel({ tint }: { tint: string }) {
  const grid = useMemo(() => gridTex(), []);
  const scoop = useScoopGeometry(0.3, 4);
  const g = useSway(0.35, 0.45);
  return (
    <group>
      <BlobShadow size={2.4} />
      <group ref={g}>
        <Plate r={1.05} />
        <RoundedBox args={[1.2, 0.18, 0.95]} radius={0.06} smoothness={3} position={[0, 0.16, 0]} rotation={[0.05, 0.3, 0]}>
          <meshStandardMaterial color={tint} map={grid} bumpMap={grid} bumpScale={4} roughness={0.6} />
        </RoundedBox>
        <mesh geometry={scoop} position={[0.1, 0.48, 0]}>
          <Cream color="#FFF4DC" />
        </mesh>
        <Drizzle y={0.72} r={0.2} drips={4} />
        {[[-0.35, 0.29, 0.25], [-0.42, 0.29, -0.15], [0.42, 0.29, 0.28]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.07, 14, 10]} />
            <Glossy color="#C2283F" rough={0.15} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Ceramic dessert bowl — syrupy gulab jamun / kunafa with pistachio, gently bobbing */
export function BowlModel({ tint }: { tint: string }) {
  const bowl = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.32, 0], [0.36, 0.04], [0.62, 0.28], [0.72, 0.5], [0.69, 0.51], [0.59, 0.31], [0.34, 0.09], [0, 0.08]], []));
  const g = useSway(0.35, 0.5);
  const balls = useRef<THREE.Group>(null);
  const clock = useClock();
  const pos: [number, number, number][] = [[-0.2, 0.42, 0.05], [0.2, 0.42, -0.04], [0, 0.5, 0.2], [0.02, 0.62, -0.05]];
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    balls.current?.children.forEach((b, i) => {
      const d = drop((t - 0.2 - i * 0.3) / 0.9, 1.2);
      b.position.set(pos[i][0], pos[i][1] + d.y + Math.sin(t * 1.5 + i) * 0.012, pos[i][2]);
      b.scale.set(d.sx, d.sy, d.sx);
      b.visible = t > 0.2 + i * 0.3;
    });
  });
  return (
    <group>
      <BlobShadow size={2.2} />
      <group ref={g}>
        <mesh geometry={bowl}>
          <Ceramic color="#FFF7EE" />
        </mesh>
        <mesh position-y={0.28} rotation-y={0}>
          <cylinderGeometry args={[0.6, 0.36, 0.04, 40, 1, true]} />
          <Ceramic color="#C2283F" rough={0.25} />
        </mesh>
        <mesh position-y={0.4} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.62, 40]} />
          <meshPhysicalMaterial color={shade(tint, 0.25)} roughness={0.05} clearcoat={1} transparent opacity={0.85} />
        </mesh>
        <group ref={balls}>
          {pos.map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.2, 28, 20]} />
              <meshPhysicalMaterial color={tint} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
            </mesh>
          ))}
        </group>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 2.4) * 0.3 * ((i % 3) / 3 + 0.3), 0.7 - (i % 4) * 0.06, Math.sin(i * 2.4) * 0.3 * ((i % 3) / 3 + 0.3)]} rotation={[i, i * 2, 0]}>
            <boxGeometry args={[0.04, 0.02, 0.03]} />
            <Matte color="#6DA544" rough={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
