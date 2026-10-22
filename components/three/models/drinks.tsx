"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  BlobShadow, Bubbles, Ceramic, Cherry, Cream, Glass, Glossy, IceCube, Leaf, Liquid, Matte, Steam, Straw,
  cachedGeometry, clamp01, easeBack, easeInOut, easeOut, shade, useClock, useLathe,
} from "./common";
import { citrusTex, crumbTex, labelTex } from "../textures";

/* ============================== COFFEE ============================== */

const latteCache = new Map<string, THREE.Texture>();
function latteTex(tint: string) {
  const hit = latteCache.get(tint);
  if (hit) return hit;
  const s = 256, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
  r.addColorStop(0, shade(tint, 0.06));
  r.addColorStop(0.8, tint);
  r.addColorStop(1, shade(tint, -0.12));
  g.fillStyle = r;
  g.fillRect(0, 0, s, s);
  // rosetta: stacked crescents + a heart
  g.fillStyle = "rgba(255,247,236,0.92)";
  for (let i = 0; i < 6; i++) {
    const y = 70 + i * 22, w = 78 - i * 9;
    g.beginPath();
    g.ellipse(s / 2, y, w, 14, 0, 0, Math.PI);
    g.ellipse(s / 2, y + 4, w * 0.8, 9, 0, Math.PI, 0, true);
    g.fill();
  }
  g.fillRect(s / 2 - 2, 60, 4, 140);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  latteCache.set(tint, t);
  return t;
}

/** Ceramic cup + saucer, latte art that swirls, curling steam */
const CUP_PROFILE: [number, number][] = [[0, 0.06], [0.3, 0.06], [0.34, 0.09], [0.4, 0.2], [0.5, 0.5], [0.56, 0.72], [0.575, 0.75], [0.555, 0.75], [0.535, 0.72], [0.47, 0.5], [0.37, 0.2], [0, 0.14]];
const SAUCER_PROFILE: [number, number][] = [[0, 0], [0.3, 0], [0.34, 0.03], [0.82, 0.05], [0.9, 0.1], [0.88, 0.11], [0.8, 0.075], [0.36, 0.06], [0, 0.06]];

export function CupModel({ tint }: { tint: string }) {
  const cup = useLathe(CUP_PROFILE);
  const saucer = useLathe(SAUCER_PROFILE);
  const art = useMemo(() => latteTex(tint), [tint]);
  const group = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    const intro = easeBack(t / 1.1);
    if (group.current) {
      group.current.rotation.y = -0.5 + Math.sin(t * 0.5) * 0.35;
      group.current.position.y = (1 - intro) * -0.4;
      group.current.scale.setScalar(0.4 + 0.6 * intro);
    }
    if (surface.current) surface.current.rotation.z = t * 0.25;
  });
  return (
    <group>
      <BlobShadow size={2.6} />
      <group ref={group}>
        <mesh geometry={saucer} castShadow>
          <Ceramic color="#FFF7EE" />
        </mesh>
        <group position-y={0.06}>
          <mesh geometry={cup}>
            <Ceramic color="#FFF7EE" />
          </mesh>
          {/* coloured band like a glazed dip */}
          <mesh position-y={0.1}>
            <cylinderGeometry args={[0.395, 0.36, 0.14, 48, 1, true]} />
            <Ceramic color={shade(tint, -0.25)} rough={0.25} />
          </mesh>
          <mesh ref={surface} rotation-x={-Math.PI / 2} position-y={0.68}>
            <circleGeometry args={[0.535, 48]} />
            <meshPhysicalMaterial map={art} roughness={0.35} clearcoat={0.4} />
          </mesh>
          <mesh position={[0.56, 0.44, 0]} rotation-z={-0.15}>
            <torusGeometry args={[0.17, 0.045, 14, 32, Math.PI * 1.25]} />
            <Ceramic color="#FFF7EE" />
          </mesh>
        </group>
        <mesh position={[-0.55, 0.11, 0.38]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[0.2, 0.05, 0.14]} />
          <Matte color="#5A2D18" rough={0.5} />
        </mesh>
      </group>
      <Steam y={0.85} height={1.3} />
    </group>
  );
}

/**
 * Scroll-driven espresso pour for the "Bean to cup" section: `progress` (0→1, from GSAP ScrollTrigger)
 * opens the stream, fills the cup, reveals latte art and lets the steam rise.
 */
export function PourCupModel({ tint, progress }: { tint: string; progress: React.MutableRefObject<number> }) {
  const cup = useLathe(CUP_PROFILE);
  const saucer = useLathe(SAUCER_PROFILE);
  const art = useMemo(() => latteTex(tint), [tint]);
  const surface = useRef<THREE.Mesh>(null);
  const artMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const streams = useRef<THREE.Group>(null);
  const steam = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const smooth = useRef(0);
  useFrame(({ clock }, dt) => {
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-dt * 6));
    const p = smooth.current;
    const fill = easeOut((p - 0.12) / 0.55); // 0 → 1
    const y = 0.17 + fill * 0.51;
    const r = 0.37 + (y - 0.2) * (0.165 / 0.52);
    if (surface.current) {
      surface.current.position.y = y;
      surface.current.scale.setScalar(Math.max(0.2, r / 0.535));
      surface.current.visible = fill > 0.01;
      surface.current.rotation.z = clock.elapsedTime * 0.2;
    }
    if (artMat.current) artMat.current.color.set(tint).lerp(new THREE.Color("#ffffff"), easeOut((p - 0.68) / 0.15));
    if (artMat.current) artMat.current.map = p > 0.68 ? art : null;
    if (artMat.current) artMat.current.needsUpdate = true;
    if (streams.current) {
      const on = clamp01((p - 0.05) / 0.06) * (1 - clamp01((p - 0.66) / 0.06));
      streams.current.scale.set(on, 1, on);
      streams.current.visible = on > 0.02;
    }
    if (steam.current) steam.current.visible = p > 0.74;
    if (turn.current) turn.current.rotation.y = -0.4 + p * 0.8;
  });
  return (
    <group>
      <BlobShadow size={2.6} />
      {/* group head of the espresso machine */}
      <group position-y={2.15}>
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, 0.22, 40]} />
          <meshStandardMaterial color="#C9CDD2" metalness={0.95} roughness={0.25} />
        </mesh>
        <mesh position-y={-0.17}>
          <cylinderGeometry args={[0.34, 0.3, 0.14, 40]} />
          <meshStandardMaterial color="#2A1810" roughness={0.5} />
        </mesh>
        <mesh position={[0.62, -0.12, 0]} rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[0.05, 0.5, 4, 12]} />
          <meshStandardMaterial color="#2A1810" roughness={0.45} />
        </mesh>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, -0.3, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 0.14, 16]} />
            <meshStandardMaterial color="#C9CDD2" metalness={0.95} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <group ref={streams}>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, 1.33, 0]}>
            <cylinderGeometry args={[0.016, 0.026, 1.4, 10]} />
            <meshPhysicalMaterial color={shade(tint, 0.08)} roughness={0.15} clearcoat={1} emissive={tint} emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
      <group ref={turn}>
        <mesh geometry={saucer}>
          <Ceramic color="#FFF7EE" />
        </mesh>
        <group position-y={0.06}>
          <mesh geometry={cup}>
            <Ceramic color="#FFF7EE" />
          </mesh>
          <mesh position-y={0.1}>
            <cylinderGeometry args={[0.395, 0.36, 0.14, 48, 1, true]} />
            <Ceramic color={shade(tint, -0.25)} rough={0.25} />
          </mesh>
          <mesh ref={surface} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.535, 48]} />
            <meshPhysicalMaterial ref={artMat} color={tint} roughness={0.35} clearcoat={0.4} />
          </mesh>
          <mesh position={[0.56, 0.44, 0]} rotation-z={-0.15}>
            <torusGeometry args={[0.17, 0.045, 14, 32, Math.PI * 1.25]} />
            <Ceramic color="#FFF7EE" />
          </mesh>
        </group>
      </group>
      <group ref={steam}>
        <Steam y={0.85} height={1.1} />
      </group>
    </group>
  );
}

/** Tall iced glass — layered coffee & milk, bobbing ice, straw, condensation sparkle */
export function IcedModel({ tint }: { tint: string }) {
  const glass = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.34, 0], [0.36, 0.04], [0.43, 1.55], [0.415, 1.55], [0.345, 0.07], [0, 0.07]], []));
  const ice = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Group>(null);
  const milk = useRef<THREE.Mesh>(null);
  const clock = useClock();
  const light = shade(tint, 0.22);
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    const f = easeOut(t / 1.6);
    if (fill.current) fill.current.scale.y = 0.05 + 0.95 * f;
    if (milk.current) {
      milk.current.scale.set(1, 0.6 + Math.sin(t * 1.4) * 0.12, 1);
      milk.current.rotation.y = t * 0.6;
    }
    ice.current?.children.forEach((cube, i) => {
      cube.position.y = 1.18 + Math.sin(t * 1.6 + i * 2.1) * 0.035 + (1 - easeOut((t - 0.6 - i * 0.25) / 0.8)) * 1.4;
      cube.rotation.set(0.5 + Math.sin(t + i) * 0.15, i * 1.3 + t * 0.15, 0.3);
    });
  });
  return (
    <group rotation-y={0.3}>
      <BlobShadow size={2} />
      <group ref={fill} position-y={0.07}>
        <mesh position-y={0.36}>
          <cylinderGeometry args={[0.37, 0.335, 0.72, 40]} />
          <Liquid color={tint} />
        </mesh>
        <mesh ref={milk} position-y={0.95}>
          <cylinderGeometry args={[0.405, 0.38, 0.5, 40]} />
          <Liquid color={light} rough={0.3} />
        </mesh>
        <mesh position-y={1.27} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.41, 40]} />
          <Liquid color={shade(light, 0.08)} rough={0.12} />
        </mesh>
      </group>
      <group ref={ice}>
        {[[-0.14, 0.05], [0.13, -0.1], [0.02, 0.17]].map(([x, z], i) => (
          <group key={i} position={[x, 1.18, z]}>
            <IceCube size={0.22} />
          </group>
        ))}
      </group>
      <Bubbles r={0.3} y0={0.15} y1={1.2} count={10} />
      <mesh geometry={glass} renderOrder={2}>
        <Glass opacity={0.22} />
      </mesh>
      <Straw position={[0.12, 1.5, 0]} rotation={[0, 0, -0.18]} length={1.3} />
    </group>
  );
}

/* =============================== TEA =============================== */

/** Dhaba-style aluminium kettle that tilts in and pours a stream */
function Kettle({ pour }: { pour: React.MutableRefObject<number> }) {
  const body = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.32, 0], [0.42, 0.12], [0.44, 0.3], [0.36, 0.46], [0.2, 0.52], [0.12, 0.6], [0, 0.6]], []));
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const p = pour.current; // 0 = parked off-frame, 1 = pouring
    g.current.position.set(1.05 + (1 - p) * 0.9, 2.05 + (1 - p) * 0.5, 0);
    g.current.rotation.z = 0.15 + p * 0.75;
    g.current.visible = p > 0.01;
  });
  return (
    <group ref={g}>
      <mesh geometry={body}>
        <meshStandardMaterial color="#C9CDD2" metalness={0.92} roughness={0.32} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[-0.5, 0.26, 0]} rotation-z={0.95}>
        <cylinderGeometry args={[0.035, 0.07, 0.45, 16]} />
        <meshStandardMaterial color="#C9CDD2" metalness={0.92} roughness={0.32} />
      </mesh>
      <mesh position={[0.12, 0.62, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.24, 0.025, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#2A1810" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Pour cycle shared by chai glass + matka: first fill on view, then a top-up every 9 s */
function usePourCycle(level: React.MutableRefObject<number>, pour: React.MutableRefObject<number>, stream: React.RefObject<THREE.Mesh | null>, topY: number) {
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    let p = 0;
    if (t < 3.2) {
      p = easeInOut(t / 0.5) * (1 - easeInOut((t - 2.6) / 0.5));
      level.current = easeOut((t - 0.4) / 2.4);
    } else {
      const k = (t - 3.2) % 9;
      p = k > 6 ? easeInOut((k - 6) / 0.5) * (1 - easeInOut((k - 7.8) / 0.5)) : 0;
      level.current = 1;
    }
    pour.current = p;
    if (stream.current) {
      const on = clamp01((p - 0.7) / 0.3);
      stream.current.visible = on > 0.02;
      stream.current.scale.set(on, 1, on);
      stream.current.position.y = topY;
    }
  });
}

function makeFluted(rb: number, rt: number, h: number) {
  const g = new THREE.CylinderGeometry(rt, rb, h, 56, 4, true);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
    const k = 1 + Math.cos(a * 14) * 0.035;
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Fluted cutting-chai glass that fills from a kettle */
export function ChaiGlassModel({ tint }: { tint: string }) {
  const glass = useMemo(() => cachedGeometry("fluted", () => makeFluted(0.27, 0.36, 0.95)), []);
  const level = useRef(0), pour = useRef(0);
  const liquid = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);
  usePourCycle(level, pour, stream, 1.42);
  useFrame(() => {
    if (liquid.current) {
      liquid.current.scale.y = 0.02 + 0.98 * level.current;
      liquid.current.visible = level.current > 0.01;
    }
  });
  return (
    <group>
      <BlobShadow size={1.8} />
      <mesh position-y={0.03}>
        <cylinderGeometry args={[0.27, 0.26, 0.06, 40]} />
        <Glass opacity={0.4} />
      </mesh>
      <group ref={liquid} position-y={0.06}>
        <mesh position-y={0.39}>
          <cylinderGeometry args={[0.33, 0.255, 0.78, 40]} />
          <Liquid color={tint} rough={0.25} />
        </mesh>
        {/* malai foam */}
        <mesh position-y={0.785} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.33, 40]} />
          <meshStandardMaterial color={shade(tint, 0.14)} roughness={0.6} />
        </mesh>
      </group>
      <mesh geometry={glass} position-y={0.5} renderOrder={2}>
        <Glass opacity={0.26} />
      </mesh>
      <mesh ref={stream} position={[0.02, 1.42, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 1.3, 12]} />
        <Liquid color={tint} rough={0.1} />
      </mesh>
      <Kettle pour={pour} />
      <Steam y={0.95} height={1.1} scale={0.45} />
    </group>
  );
}

/** Clay matka with smoky doodh patti */
export function MatkaModel({ tint }: { tint: string }) {
  const pot = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.22, 0], [0.3, 0.06], [0.42, 0.3], [0.45, 0.45], [0.4, 0.66], [0.36, 0.74], [0.4, 0.8], [0.38, 0.83], [0.33, 0.78], [0.36, 0.66], [0, 0.6]], []));
  const clay = useMemo(() => crumbTex("#B8643A", "rgba(90,40,20,0.16)", "clay"), []);
  const level = useRef(0), pour = useRef(0);
  const liquid = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  usePourCycle(level, pour, stream, 1.42);
  useFrame(() => {
    if (liquid.current) {
      liquid.current.position.y = 0.4 + level.current * 0.36;
      liquid.current.visible = level.current > 0.01;
    }
  });
  return (
    <group>
      <BlobShadow size={2} />
      <mesh geometry={pot}>
        <Matte map={clay} rough={0.92} bumpMap={clay} bump={0.6} />
      </mesh>
      <mesh position-y={0.45}>
        <torusGeometry args={[0.44, 0.012, 8, 48]} />
        <Matte color="#8E4526" />
      </mesh>
      <mesh ref={liquid} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.35, 40]} />
        <Liquid color={tint} rough={0.4} />
      </mesh>
      <mesh ref={stream} position={[0.02, 1.42, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 1.3, 12]} />
        <Liquid color={tint} rough={0.1} />
      </mesh>
      <Kettle pour={pour} />
      <Steam y={0.85} height={1.2} scale={0.5} />
    </group>
  );
}

/* ============================ COLD DRINKS ============================ */

/** Tumbler with tinted soda, mint, lime wheel, bobbing ice and rising fizz */
export function MojitoModel({ tint }: { tint: string }) {
  const glass = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.4, 0], [0.42, 0.05], [0.47, 1.25], [0.455, 1.25], [0.405, 0.12], [0, 0.12]], []));
  const lime = useMemo(() => citrusTex("#6FAE2E", "#C9E36A", "lime"), []);
  const ice = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    ice.current?.children.forEach((cube, i) => {
      cube.position.y = 0.95 + Math.sin(t * 1.8 + i * 1.7) * 0.04 + (1 - easeOut((t - i * 0.2) / 0.9)) * 1.3;
      cube.rotation.set(Math.sin(t * 0.7 + i) * 0.3, i + t * 0.2, 0.4);
    });
    if (wheel.current) wheel.current.rotation.z = Math.sin(t * 0.9) * 0.12 - 0.25;
  });
  return (
    <group rotation-y={-0.25}>
      <BlobShadow size={2} />
      <mesh position-y={0.58}>
        <cylinderGeometry args={[0.43, 0.4, 0.95, 40]} />
        <Liquid color={tint} rough={0.05} opacity={0.72} />
      </mesh>
      {[[-0.18, 0.62, 0.15, 0.2], [0.16, 0.45, -0.1, 2.4], [0.05, 0.85, 0.2, 4.2], [-0.1, 0.3, -0.18, 1.1]].map(([x, y, z, r], i) => (
        <Leaf key={i} position={[x, y, z]} rotation={[0.4, r, 0.7]} s={0.9} />
      ))}
      <group ref={ice}>
        {[[-0.15, 0.08], [0.15, 0.1], [0.0, -0.17], [0.12, -0.12]].map(([x, z], i) => (
          <group key={i} position={[x, 0.95, z]}>
            <IceCube size={0.2} />
          </group>
        ))}
      </group>
      <Bubbles r={0.34} y0={0.14} y1={1.02} count={22} />
      <mesh geometry={glass} renderOrder={2}>
        <Glass opacity={0.2} />
      </mesh>
      <group ref={wheel} position={[0.38, 1.22, 0.12]} rotation-y={0.4}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.04, 32]} />
          <meshStandardMaterial color="#6FAE2E" roughness={0.4} />
        </mesh>
        <mesh position-y={0.021} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.235, 32]} />
          <meshStandardMaterial map={lime} roughness={0.35} />
        </mesh>
      </group>
      <Leaf position={[-0.1, 1.2, 0]} rotation={[0.2, 0.3, 0.2]} s={1.1} />
      <Straw position={[-0.14, 1.35, -0.05]} rotation={[0.1, 0, 0.2]} length={1.2} color="#2E8B57" />
    </group>
  );
}

/** Branded can — spins up, condensation beads, fizz pops from the tab */
export function CanModel({ tint }: { tint: string }) {
  const label = useMemo(() => labelTex(tint, `label-${tint}`), [tint]);
  const top = useLathe(useMemo<[number, number][]>(() => [[0, 1.42], [0.3, 1.42], [0.33, 1.44], [0.32, 1.38], [0.36, 1.3]], []));
  const bottom = useLathe(useMemo<[number, number][]>(() => [[0.36, 0.1], [0.3, 0.02], [0.24, 0], [0.18, 0.04], [0, 0.06]], []));
  const can = useRef<THREE.Group>(null);
  const drops = useMemo(() => Array.from({ length: 40 }, () => ({ a: Math.random() * Math.PI * 2, y: 0.2 + Math.random() * 1.0, s: 0.012 + Math.random() * 0.018 })), []);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    if (!can.current) return;
    const k = easeOut(t / 1.4);
    can.current.rotation.y = -0.6 + k * Math.PI * 2 * 0.75 + Math.sin(t * 0.6) * 0.25;
    can.current.position.y = Math.sin(t * 1.2) * 0.04;
    can.current.rotation.z = Math.sin(t * 0.8) * 0.05;
  });
  return (
    <group>
      <BlobShadow size={1.7} />
      <group ref={can}>
        <mesh position-y={0.7}>
          <cylinderGeometry args={[0.36, 0.36, 1.2, 48, 1, true]} />
          <meshStandardMaterial map={label} metalness={0.45} roughness={0.28} envMapIntensity={1.3} />
        </mesh>
        <mesh geometry={top}>
          <meshStandardMaterial color="#D9DDE2" metalness={1} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={bottom}>
          <meshStandardMaterial color="#D9DDE2" metalness={1} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.08, 1.435, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.03, 0.08, 20]} />
          <meshStandardMaterial color="#BFC4CA" metalness={1} roughness={0.2} />
        </mesh>
        {drops.map((d, i) => (
          <mesh key={i} position={[Math.cos(d.a) * 0.365, d.y, Math.sin(d.a) * 0.365]} scale={[d.s, d.s * 1.3, d.s]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.6} roughness={0} clearcoat={1} envMapIntensity={2} />
          </mesh>
        ))}
      </group>
      <group position-y={0.2}>
        <Bubbles r={0.12} y0={1.3} y1={2.0} count={10} />
      </group>
    </group>
  );
}

/** Thick shake in a flared glass with a wobbling whipped-cream swirl */
export function ShakeModel({ tint }: { tint: string }) {
  const glass = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.3, 0], [0.3, 0.05], [0.12, 0.12], [0.1, 0.3], [0.3, 0.42], [0.42, 1.45], [0.405, 1.45], [0.29, 0.47], [0, 0.42]], []));
  const cream = useRef<THREE.Group>(null);
  const cherry = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    if (cream.current) {
      const intro = easeBack((t - 0.4) / 0.9, 2.4);
      const wob = Math.sin(t * 5) * 0.04 * Math.exp(-((t % 5) * 0.8)) + Math.sin(t * 1.3) * 0.02;
      cream.current.scale.set(intro * (1 + wob), intro * (1 - wob * 1.4), intro * (1 + wob));
      cream.current.rotation.y = t * 0.4;
    }
    if (cherry.current) {
      const d = 1 - easeBack((t - 1.0) / 0.7, 2.6);
      cherry.current.position.y = 1.98 + d * 1.2;
      cherry.current.visible = t > 0.95;
    }
  });
  return (
    <group rotation-y={0.2}>
      <BlobShadow size={1.9} />
      <mesh position-y={0.95}>
        <cylinderGeometry args={[0.4, 0.29, 0.98, 40]} />
        <Cream color={tint} />
      </mesh>
      {/* chocolate swirl painted down the inside */}
      <mesh position-y={0.95} rotation-y={0.4}>
        <cylinderGeometry args={[0.402, 0.292, 0.98, 40, 1, true, 0, 0.5]} />
        <Glossy color="#5A2D18" />
      </mesh>
      <mesh geometry={glass} renderOrder={2}>
        <Glass opacity={0.24} />
      </mesh>
      <group ref={cream} position-y={1.42}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position-y={i * 0.11} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.33 - i * 0.085, 0.085 - i * 0.008, 16, 40]} />
            <Cream color="#FFF8EF" />
          </mesh>
        ))}
        <mesh position-y={0.42}>
          <coneGeometry args={[0.07, 0.16, 16]} />
          <Cream color="#FFF8EF" />
        </mesh>
      </group>
      <group ref={cherry} position={[0, 1.98, 0]}>
        <Cherry r={0.11} />
      </group>
      <Straw position={[0.16, 1.7, 0]} rotation={[0, 0, -0.25]} length={1.1} />
      <RoundedBox args={[0.06, 0.5, 0.06]} radius={0.02} position={[-0.2, 1.75, 0.1]} rotation={[0.2, 0, 0.35]}>
        <Matte color="#C9955A" />
      </RoundedBox>
    </group>
  );
}
