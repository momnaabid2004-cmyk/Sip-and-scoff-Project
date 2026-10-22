"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { BlobShadow, Cherry, Cream, Glass, Glossy, Matte, Sprinkles, drop, easeBack, easeOut, shade, useClock, useLathe, useScoopGeometry } from "./common";
import { waffleTex } from "../textures";

/** Scoop that drops in, squashes on impact and wobbles to rest; loops every `period` s */
function DroppingScoop({ color, y, delay, period, r = 0.42, seed = 1, x = 0, z = 0 }: { color: string; y: number; delay: number; period: number; r?: number; seed?: number; x?: number; z?: number }) {
  const geo = useScoopGeometry(r, seed);
  const g = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    if (!g.current) return;
    const t = clock(c.elapsedTime);
    const p = t % period;
    const out = p > period - 0.45 ? easeOut((p - (period - 0.45)) / 0.45) : 0; // shrink away before the loop restarts
    const d = drop((p - delay) / 1.0, 1.8);
    const vis = p >= delay ? 1 - out : 0;
    g.current.position.set(x, y + d.y, z);
    g.current.scale.set(d.sx * vis, d.sy * vis, d.sx * vis);
    g.current.visible = vis > 0.001;
  });
  return (
    <group ref={g}>
      <mesh geometry={geo}>
        <Cream color={color} />
      </mesh>
    </group>
  );
}

/** Waffle cone with 1–2 scoops and sprinkles */
export function ConeModel({ tint }: { tint: string }) {
  const tex = useMemo(() => waffleTex(), []);
  const cone = useMemo(() => {
    const g = new THREE.ConeGeometry(0.36, 1.15, 40, 1, true);
    g.rotateX(Math.PI);
    g.translate(0, 0.575, 0);
    return g;
  }, []);
  const spin = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    if (spin.current) {
      spin.current.rotation.y = t * 0.45;
      spin.current.rotation.z = Math.sin(t * 0.8) * 0.06;
    }
  });
  const period = 7;
  return (
    <group>
      <BlobShadow size={1.6} opacity={0.5} />
      <group ref={spin} position-y={0.05}>
        <mesh geometry={cone}>
          <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={2} roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={1.15} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.36, 0.045, 12, 40]} />
          <Matte color="#C98A45" rough={0.7} />
        </mesh>
        <DroppingScoop color={tint} y={1.33} delay={0.1} period={period} seed={2} />
        <DroppingScoop color={shade(tint, -0.08)} y={1.86} delay={0.75} period={period} r={0.36} seed={5} />
        <Sprinkles y={1.86} r={0.37} delay={0.27} period={period} />
      </group>
    </group>
  );
}

/** Glass goblet sundae: scoops drop in, sauce runs down, cherry bounces on top */
export function SundaeModel({ tint }: { tint: string }) {
  const goblet = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.42, 0], [0.42, 0.04], [0.08, 0.1], [0.07, 0.42], [0.2, 0.5], [0.55, 0.78], [0.66, 1.05], [0.64, 1.06], [0.53, 0.8], [0.18, 0.54], [0, 0.52]], []));
  const sauce = useRef<THREE.Group>(null);
  const cherry = useRef<THREE.Group>(null);
  const clock = useClock();
  const period = 8;
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    const p = t % period;
    const out = p > period - 0.45 ? 1 - easeOut((p - (period - 0.45)) / 0.45) : 1;
    if (sauce.current) {
      const k = easeOut((p - 1.9) / 1.1) * out;
      sauce.current.scale.set(1, Math.max(0.001, k), 1);
      sauce.current.visible = k > 0.01;
    }
    if (cherry.current) {
      const d = drop((p - 2.6) / 0.9, 1.5);
      cherry.current.position.y = 1.86 + d.y;
      cherry.current.scale.set(d.sx * out, d.sy * out, d.sx * out);
      cherry.current.visible = p > 2.6;
    }
  });
  return (
    <group rotation-y={0.4}>
      <BlobShadow size={1.9} />
      <mesh position-y={0.72}>
        <cylinderGeometry args={[0.6, 0.2, 0.42, 40]} />
        <Cream color={shade(tint, 0.15)} />
      </mesh>
      <mesh geometry={goblet} renderOrder={2}>
        <Glass opacity={0.3} />
      </mesh>
      <DroppingScoop color={tint} x={-0.2} z={0.05} y={1.1} delay={0.2} period={period} r={0.36} seed={3} />
      <DroppingScoop color={shade(tint, -0.12)} x={0.22} z={-0.04} y={1.1} delay={0.7} period={period} r={0.35} seed={7} />
      <DroppingScoop color="#FFF4DC" x={0} z={0} y={1.5} delay={1.2} period={period} r={0.33} seed={9} />
      {/* chocolate sauce that "pours" down over the top scoop */}
      <group ref={sauce} position-y={1.86}>
        <mesh position-y={-0.04} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Glossy color="#4A2412" rough={0.1} />
        </mesh>
        {[0.3, 1.6, 2.7, 4.4, 5.4].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.27, -0.12 - (i % 2) * 0.06, Math.sin(a) * 0.27]}>
            <capsuleGeometry args={[0.032, 0.16 + (i % 3) * 0.06, 4, 8]} />
            <Glossy color="#4A2412" rough={0.1} />
          </mesh>
        ))}
      </group>
      <group ref={cherry} position-y={1.86}>
        <Cherry r={0.11} />
      </group>
      <RoundedBox args={[0.1, 0.55, 0.04]} radius={0.015} position={[0.32, 1.55, 0.18]} rotation={[0.2, 0.2, -0.45]}>
        <Matte color="#E2B26A" rough={0.6} />
      </RoundedBox>
    </group>
  );
}

/** Kulfi on a stick with pistachio crumbs — floats and turns, a single melt drip slides down */
export function KulfiModel({ tint }: { tint: string }) {
  const body = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.16, 0], [0.2, 0.04], [0.24, 0.5], [0.27, 0.95], [0.25, 1.06], [0.18, 1.13], [0, 1.15]], []), 40);
  const crumbs = useMemo(
    () =>
      Array.from({ length: 34 }, () => {
        const a = Math.random() * Math.PI * 2, y = 0.7 + Math.random() * 0.42;
        const r = y > 1.06 ? 0.2 * Math.random() : 0.255 + 0.02 * (y - 0.7);
        return { p: [Math.cos(a) * r, y > 1.06 ? 1.14 : y, Math.sin(a) * r] as [number, number, number], r: [Math.random() * 3, Math.random() * 3, 0] as [number, number, number], c: Math.random() > 0.3 ? "#6DA544" : "#D4A373" };
      }),
    []
  );
  const g = useRef<THREE.Group>(null);
  const drip = useRef<THREE.Mesh>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    if (g.current) {
      const intro = easeBack(t / 1.0);
      g.current.position.y = 0.42 + Math.sin(t * 1.4) * 0.06 + (1 - intro) * -0.5;
      g.current.rotation.set(0, t * 0.5, Math.sin(t * 0.9) * 0.08 + 0.12);
    }
    if (drip.current) {
      const k = (t % 4) / 4;
      drip.current.position.y = 0.95 - easeOut(k) * 0.55;
      drip.current.scale.set(1, 1 + k * 0.8, 1);
    }
  });
  return (
    <group>
      <BlobShadow size={1.4} opacity={0.45} />
      <group ref={g}>
        <mesh position-y={-0.3}>
          <boxGeometry args={[0.1, 0.62, 0.025]} />
          <Matte color="#D9B47A" rough={0.85} />
        </mesh>
        <mesh geometry={body}>
          <Cream color={tint} />
        </mesh>
        <mesh ref={drip} position={[0.24, 0.95, 0.08]}>
          <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
          <Cream color={tint} />
        </mesh>
        {crumbs.map((cr, i) => (
          <mesh key={i} position={cr.p} rotation={cr.r}>
            <boxGeometry args={[0.035, 0.022, 0.03]} />
            <Matte color={cr.c} rough={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
