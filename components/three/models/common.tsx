"use client";
import { createContext, useContext, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useFrame } from "@react-three/fiber";
import { shadowTex, steamTex } from "../textures";

/* ------------------------------------------------------------------ */
/*  Shared helpers for the procedural food models                       */
/*  Units: every model sits on y = 0 and is roughly 2 units tall.       */
/* ------------------------------------------------------------------ */

/** `still` = reduced motion → models render their finished pose without looping. */
export const MotionCtx = createContext<{ still: boolean; seed: number }>({ still: false, seed: 0 });
export const useMotion = () => useContext(MotionCtx);

/**
 * Seconds since this model mounted (models mount when scrolled into view, so the
 * intro animation plays as the visitor reaches it). Reduced motion → a fixed "finished" time.
 */
export function useClock() {
  const { still } = useMotion();
  const start = useRef<number | null>(null);
  return (t: number) => {
    if (still) return 1000;
    if (start.current === null) start.current = t;
    return t - start.current;
  };
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => {
  const v = clamp01(x);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
/** springy overshoot 0→1 (ease-out-back) */
export const easeBack = (x: number, s = 1.9) => {
  const v = clamp01(x) - 1;
  return 1 + (s + 1) * v * v * v + s * v * v;
};
/** bounce-in landing: falls from `h`, squashes on impact and settles */
export function drop(p: number, h = 1.6) {
  const v = clamp01(p);
  if (v < 0.55) {
    const f = v / 0.55;
    return { y: h * (1 - f * f), sx: 1 - 0.08 * f, sy: 1 + 0.14 * f };
  }
  const k = (v - 0.55) / 0.45;
  const wob = Math.sin(k * Math.PI * 3) * Math.exp(-k * 4);
  return { y: Math.max(0, wob * 0.06), sx: 1 + 0.16 * wob, sy: 1 - 0.2 * wob };
}

/**
 * Geometry cache shared by every view: a model that scrolls into view reuses the geometry built the
 * first time instead of rebuilding it (no main-thread work while scrolling).
 */
const geoCache = new Map<string, THREE.BufferGeometry>();
export function cachedGeometry(key: string, build: () => THREE.BufferGeometry) {
  let g = geoCache.get(key);
  if (!g) {
    g = build();
    geoCache.set(key, g);
  }
  return g;
}

/** Lathe (revolved profile) from [radius, height] pairs — cached by profile */
export function useLathe(points: [number, number][], segments = 40) {
  return useMemo(
    () => cachedGeometry(`lathe:${segments}:${points.join(";")}`, () => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments)),
    [points, segments]
  );
}

/* ------------------------------ materials ------------------------------ */

export function Ceramic({ color = "#FFF7EE", rough = 0.32 }: { color?: string; rough?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={1} clearcoatRoughness={0.12} envMapIntensity={1.1} />;
}

/** Thin, cheap glass (no transmission pass — keeps many views at 60fps) */
export function Glass({ opacity = 0.24, tint = "#ffffff" }: { opacity?: number; tint?: string }) {
  return (
    <meshPhysicalMaterial
      color={tint}
      roughness={0.04}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.02}
      transparent
      opacity={opacity}
      envMapIntensity={2.2}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

export function Liquid({ color, rough = 0.18, opacity = 1 }: { color: string; rough?: number; opacity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.6} clearcoatRoughness={0.1} transparent={opacity < 1} opacity={opacity} envMapIntensity={1} />;
}

/** Ice cream / cream: soft, slightly velvety */
export function Cream({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.62} sheen={1} sheenRoughness={0.5} sheenColor="#ffffff" envMapIntensity={0.7} />;
}

export function Matte({ color, rough = 0.75, map, bumpMap, bump = 0 }: { color?: string; rough?: number; map?: THREE.Texture; bumpMap?: THREE.Texture; bump?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} map={map} bumpMap={bumpMap} bumpScale={bump} envMapIntensity={0.6} />;
}

export function Glossy({ color, rough = 0.2 }: { color: string; rough?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.2} />;
}

/* ------------------------------ effects ------------------------------ */

/** Soft blob shadow on the "table" (cheaper than ContactShadows when many views are on screen) */
export function BlobShadow({ size = 2.2, opacity = 0.7 }: { size?: number; opacity?: number }) {
  const map = useMemo(() => shadowTex(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={-1}>
      <planeGeometry args={[size, size * 0.62]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Rising, curling steam puffs */
export function Steam({ y = 1, count = 7, spread = 0.22, height = 1.2, scale = 0.55 }: { y?: number; count?: number; spread?: number; height?: number; scale?: number }) {
  const map = useMemo(() => steamTex(), []);
  const group = useRef<THREE.Group>(null);
  const clock = useClock();
  const { still } = useMotion();
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ o: i / count, a: Math.random() * Math.PI * 2, s: 0.7 + Math.random() * 0.6 })), [count]);
  useFrame(({ clock: c }) => {
    const g = group.current;
    if (!g) return;
    const t = clock(c.elapsedTime);
    g.children.forEach((child, i) => {
      const sd = seeds[i];
      const p = (t * 0.28 + sd.o) % 1;
      const s = child as THREE.Sprite;
      s.position.set(Math.sin(p * 5 + sd.a) * spread * p, y + p * height, Math.cos(p * 4 + sd.a) * spread * 0.5 * p);
      const k = scale * sd.s * (0.4 + p * 0.9);
      s.scale.set(k, k, k);
      (s.material as THREE.SpriteMaterial).opacity = still ? 0 : Math.sin(p * Math.PI) * 0.42;
    });
  });
  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial map={map} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

/** Carbonation bubbles inside a glass of radius r between y0 and y1 */
export function Bubbles({ r = 0.32, y0 = 0.15, y1 = 1.3, count = 14, color = "#ffffff" }: { r?: number; y0?: number; y1?: number; count?: number; color?: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const clock = useClock();
  const seeds = useMemo(() => Array.from({ length: count }, () => ({ a: Math.random() * Math.PI * 2, d: Math.random() * r, o: Math.random(), sp: 0.35 + Math.random() * 0.5, s: 0.012 + Math.random() * 0.02 })), [count, r]);
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock: c }) => {
    if (!mesh.current) return;
    const t = clock(c.elapsedTime);
    seeds.forEach((b, i) => {
      const p = (t * b.sp + b.o) % 1;
      m.position.set(Math.cos(b.a) * b.d + Math.sin(t * 3 + i) * 0.01, y0 + p * (y1 - y0), Math.sin(b.a) * b.d);
      m.scale.setScalar(b.s * (0.6 + p));
      m.updateMatrix();
      mesh.current!.setMatrixAt(i, m.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshPhysicalMaterial color={color} roughness={0} transparent opacity={0.55} clearcoat={1} envMapIntensity={2} depthWrite={false} />
    </instancedMesh>
  );
}

const SPRINKLE_COLORS = ["#E8476A", "#FFC53D", "#7FD0C4", "#FFFFFF", "#A98BE0", "#5BBF7A"];

/** Sprinkles that rain down onto a dome of radius r centred at y */
export function Sprinkles({ y = 1, r = 0.4, count = 26, delay = 0.45, period = 4 }: { y?: number; r?: number; count?: number; delay?: number; period?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const clock = useClock();
  const m = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.random() * 1.1;
        return {
          end: new THREE.Vector3(Math.sin(ph) * Math.cos(th) * r, y + Math.cos(ph) * r * 0.92, Math.sin(ph) * Math.sin(th) * r),
          rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3),
          d: Math.random() * 0.12,
        };
      }),
    [count, r, y]
  );
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, [count]);
  useFrame(({ clock: c }) => {
    if (!mesh.current) return;
    const t = clock(c.elapsedTime);
    const p = (t % period) / period;
    seeds.forEach((s, i) => {
      const k = easeOut((p - delay - s.d) / 0.14);
      const fade = p > 0.92 ? 1 - (p - 0.92) / 0.08 : 1;
      m.position.set(s.end.x, s.end.y + (1 - k) * 1.4, s.end.z);
      m.rotation.copy(s.rot);
      m.scale.set(0.018, 0.06, 0.018).multiplyScalar(k > 0 ? fade : 0);
      m.updateMatrix();
      mesh.current!.setMatrixAt(i, m.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <capsuleGeometry args={[1, 1, 2, 6]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </capsuleGeometry>
      <meshStandardMaterial vertexColors roughness={0.4} />
    </instancedMesh>
  );
}

/** Indexed (shared-vertex) icosphere so normals are smooth even at low detail */
export function smoothIco(radius: number, detail: number) {
  const raw = new THREE.IcosahedronGeometry(radius, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  return mergeVertices(raw);
}

/** A lumpy scoop: icosphere with vertex noise + a "drip" skirt */
export function useScoopGeometry(radius = 0.42, seed = 1) {
  return useMemo(() => cachedGeometry(`scoop:${radius}:${seed}`, () => {
    const g = smoothIco(radius, 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 9 + seed) * Math.cos(v.z * 8 - seed) * 0.035 + Math.sin(v.y * 14 + seed * 2) * 0.015;
      v.multiplyScalar(1 + n);
      // flatten the bottom and push out a ragged lip like a real scooped ball
      if (v.y < -radius * 0.35) {
        const lip = 1 + 0.12 * (0.5 + 0.5 * Math.sin(Math.atan2(v.z, v.x) * 7 + seed));
        v.x *= lip;
        v.z *= lip;
        v.y = -radius * 0.35 - (v.y + radius * 0.35) * 0.25;
      }
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }), [radius, seed]);
}

/** Straw with candy stripes */
export function Straw({ position, rotation, length = 1.6, color = "#E8476A" }: { position: [number, number, number]; rotation?: [number, number, number]; length?: number; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.035, length, 14, 1, true]} />
        <Glossy color={color} rough={0.35} />
      </mesh>
      <mesh position-y={length * 0.25}>
        <cylinderGeometry args={[0.036, 0.036, length * 0.12, 14, 1, true]} />
        <Glossy color="#FFF7EE" rough={0.35} />
      </mesh>
    </group>
  );
}

/** Mint leaf (flat ellipse with a slight curl) */
export function Leaf({ position, rotation, s = 1, color = "#3E9B5A" }: { position: [number, number, number]; rotation?: [number, number, number]; s?: number; color?: string }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.12, 0.12, 0, 0.32);
    shape.quadraticCurveTo(-0.12, 0.12, 0, 0);
    const g = new THREE.ShapeGeometry(shape, 8);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getX(i) * 4, 2) * 0.06);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={s}>
      <meshStandardMaterial color={color} roughness={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Rounded ice cube */
export function IceCube({ size = 0.22 }: { size?: number }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size, 1, 1, 1]} />
      <meshPhysicalMaterial color="#F2FBFF" roughness={0.08} transparent opacity={0.45} clearcoat={1} envMapIntensity={2.5} depthWrite={false} />
    </mesh>
  );
}

/** Glossy cherry with stem — used as the "bounce" accent on desserts */
export function Cherry({ r = 0.12 }: { r?: number }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 24, 18]} />
        <Glossy color="#C2283F" rough={0.12} />
      </mesh>
      <mesh position={[0.02, r * 1.6, 0]} rotation-z={-0.35}>
        <cylinderGeometry args={[0.008, 0.01, r * 1.6, 6]} />
        <meshStandardMaterial color="#5B3A1E" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Lighten / darken a hex colour */
export function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
  return `#${c.getHexString()}`;
}
