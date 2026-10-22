"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { smoothIco, BlobShadow, Ceramic, Glossy, Matte, drop, easeBack, easeOut, shade, useClock, useLathe } from "./common";
import { crumbTex } from "../textures";

const PERIOD = 7.5;

/** One layer of a stack: falls in at `delay`, squashes on landing, shrinks away just before the loop restarts */
function Layer({ y, delay, children, period = PERIOD, h = 1.4 }: { y: number; delay: number; children: React.ReactNode; period?: number; h?: number }) {
  const g = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    if (!g.current) return;
    const p = clock(c.elapsedTime) % period;
    const out = p > period - 0.5 ? 1 - easeOut((p - (period - 0.5)) / 0.5) : 1;
    const d = drop((p - delay) / 0.75, h);
    const vis = p >= delay ? out : 0;
    g.current.position.y = y + d.y;
    g.current.scale.set(d.sx * vis, d.sy * vis, d.sx * vis);
    g.current.visible = vis > 0.001;
  });
  return <group ref={g}>{children}</group>;
}

/** Slow turntable used by every snack so the layers read in 3D */
function Turntable({ children, speed = 0.35, tilt = 0.05 }: { children: React.ReactNode; speed?: number; tilt?: number }) {
  const g = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    if (g.current) {
      g.current.rotation.y = -0.5 + Math.sin(t * speed) * 0.6;
      g.current.rotation.x = Math.sin(t * 0.7) * tilt;
    }
  });
  return <group ref={g}>{children}</group>;
}

function triangle(size: number) {
  const s = new THREE.Shape();
  s.moveTo(-size, -size * 0.6);
  s.lineTo(size, -size * 0.6);
  s.lineTo(-size, size * 0.9);
  s.closePath();
  return s;
}
function useSlab(shape: THREE.Shape, depth: number, bevel = 0.04) {
  return useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12 });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, [shape, depth, bevel]);
}

/** Wavy lettuce sheet */
function useLettuce(shape: THREE.Shape) {
  return useMemo(() => {
    const g = new THREE.ShapeGeometry(shape, 24);
    g.scale(1.12, 1.12, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * Math.cos(p.getY(i) * 12) * 0.035);
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, [shape]);
}

/** Triple-decker club sandwich halves — every layer stacks into place */
export function SandwichModel({ tint }: { tint: string }) {
  const tri = useMemo(() => triangle(0.62), []);
  const bread = useSlab(tri, 0.1, 0.05);
  const filling = useSlab(tri, 0.06, 0.02);
  const lettuce = useLettuce(tri);
  const toast = useMemo(() => crumbTex("#D99A4E", "rgba(130,70,25,0.5)", "toast"), []);
  const layers: { kind: "bread" | "fill" | "leaf"; color?: string; y: number }[] = [
    { kind: "bread", y: 0.05 },
    { kind: "leaf", y: 0.22 },
    { kind: "fill", color: tint, y: 0.27 },
    { kind: "fill", color: "#FFD45C", y: 0.36 },
    { kind: "bread", y: 0.45 },
    { kind: "fill", color: "#D9472F", y: 0.62 },
    { kind: "leaf", y: 0.69 },
    { kind: "bread", y: 0.74 },
  ];
  return (
    <group>
      <BlobShadow size={2.6} />
      <Turntable>
        <mesh position-y={0.02} scale={[1, 0.3, 1]}>
          <cylinderGeometry args={[1.05, 0.95, 0.12, 48]} />
          <Ceramic />
        </mesh>
        {layers.map((l, i) => (
          <Layer key={i} y={l.y} delay={0.1 + i * 0.28}>
            {l.kind === "bread" ? (
              <mesh geometry={bread}>
                <meshStandardMaterial map={toast} bumpMap={toast} bumpScale={1.2} roughness={0.85} />
              </mesh>
            ) : l.kind === "leaf" ? (
              <mesh geometry={lettuce}>
                <meshStandardMaterial color="#6FB146" roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            ) : (
              <mesh geometry={filling}>
                <Glossy color={l.color!} rough={0.45} />
              </mesh>
            )}
          </Layer>
        ))}
        <Layer y={0.86} delay={0.1 + layers.length * 0.28}>
          <mesh position={[-0.25, 0.25, 0.05]}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
            <Matte color="#E9D3A8" />
          </mesh>
          <mesh position={[-0.25, 0.52, 0.05]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <Glossy color="#C2283F" />
          </mesh>
        </Layer>
      </Turntable>
    </group>
  );
}

/** Fries in a carton — each fry hops out and drops back */
export function FriesModel({ tint }: { tint: string }) {
  const fries = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 * 2.3;
        const r = 0.08 + (i % 4) * 0.055;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.6, h: 0.75 + ((i * 37) % 10) / 22, rx: (Math.random() - 0.5) * 0.4, rz: (Math.random() - 0.5) * 0.5, o: Math.random() * Math.PI * 2 };
      }),
    []
  );
  const carton = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.5, 0.36, 0.8, 4, 1, true);
    g.rotateY(Math.PI / 4);
    g.translate(0, 0.4, 0);
    return g;
  }, []);
  const grp = useRef<THREE.Group>(null);
  const clock = useClock();
  const fryColor = shade(tint, -0.04);
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    grp.current?.children.forEach((f, i) => {
      const s = fries[i];
      const intro = easeBack((t - i * 0.05) / 0.6);
      const hop = Math.max(0, Math.sin(t * 2.4 + s.o)) ** 6 * 0.18;
      f.position.set(s.x, 0.2 + s.h / 2 - (1 - intro) * 0.8 + hop, s.z);
      f.rotation.set(s.rx + hop * 0.6, 0, s.rz);
    });
  });
  return (
    <group>
      <BlobShadow size={1.8} />
      <Turntable speed={0.3} tilt={0.03}>
        <group ref={grp}>
          {fries.map((s, i) => (
            <mesh key={i}>
              <boxGeometry args={[0.07, s.h, 0.07]} />
              <meshStandardMaterial color={fryColor} roughness={0.55} />
            </mesh>
          ))}
        </group>
        <mesh geometry={carton}>
          <meshStandardMaterial color="#C2283F" roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={0.55} geometry={useMemo(() => {
          const g = new THREE.CylinderGeometry(0.47, 0.44, 0.12, 4, 1, true);
          g.rotateY(Math.PI / 4);
          return g;
        }, [])}>
          <meshStandardMaterial color="#FFF7EE" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </Turntable>
    </group>
  );
}

/** Shawarma wrap halves in paper, fillings peeking out */
export function WrapModel({ tint }: { tint: string }) {
  const tortilla = useMemo(() => crumbTex("#EBC98E", "rgba(170,110,50,0.4)", "tortilla"), []);
  const half = (key: number, pos: [number, number, number], rot: [number, number, number], delay: number) => (
    <Layer key={key} y={pos[1]} delay={delay} h={1.2}>
      <group position={[pos[0], 0, pos[2]]} rotation={rot}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.95, 32]} />
          <meshStandardMaterial map={tortilla} bumpMap={tortilla} bumpScale={1} roughness={0.85} />
        </mesh>
        <mesh position-y={0.476} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.27, 32]} />
          <meshStandardMaterial color={tint} roughness={0.7} />
        </mesh>
        {[[-0.1, 0.06, "#6FB146"], [0.08, -0.08, "#D9472F"], [0.12, 0.1, "#FFF2D6"], [-0.05, -0.12, "#8E4526"]].map(([x, z, c], i) => (
          <mesh key={i} position={[x as number, 0.5, z as number]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color={c as string} roughness={0.5} />
          </mesh>
        ))}
        <mesh position-y={-0.12}>
          <cylinderGeometry args={[0.3, 0.3, 0.72, 32, 1, true]} />
          <meshStandardMaterial color="#F4EDE1" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={-0.16}>
          <cylinderGeometry args={[0.302, 0.302, 0.1, 32, 1, true]} />
          <meshStandardMaterial color="#C2283F" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Layer>
  );
  return (
    <group>
      <BlobShadow size={2.2} />
      <Turntable speed={0.35}>
        {half(0, [-0.25, 0.5, 0], [0, 0, 0.2], 0.1)}
        {half(1, [0.3, 0.46, 0.1], [0.15, 0, -0.32], 0.5)}
      </Turntable>
    </group>
  );
}

/** Burger built layer by layer: bun, patty, cheese, lettuce, tomato, sesame bun */
export function BurgerModel({ tint }: { tint: string }) {
  const bunTex = useMemo(() => crumbTex("#D9893F", "rgba(140,70,20,0.3)", "bun"), []);
  const patty = useMemo(() => crumbTex(shade(tint, -0.3), "rgba(40,20,10,0.6)", `patty-${tint}`), [tint]);
  const top = useLathe(useMemo<[number, number][]>(() => [[0, 0.5], [0.3, 0.46], [0.52, 0.32], [0.64, 0.14], [0.66, 0.04], [0.6, 0], [0, 0]], []));
  const bottom = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.56, 0], [0.63, 0.05], [0.64, 0.17], [0.6, 0.2], [0, 0.2]], []));
  const lettuce = useMemo(() => {
    const g = new THREE.CircleGeometry(0.71, 64, 0, Math.PI * 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y);
      p.setZ(i, Math.sin(Math.atan2(y, x) * 9) * 0.025 * r - r * r * 0.05);
    }
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, []);
  const cheese = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.2, 1.2, 12, 12);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), d = Math.max(Math.abs(x), Math.abs(y));
      p.setZ(i, -Math.max(0, d - 0.45) * 0.9);
    }
    g.rotateX(-Math.PI / 2);
    g.rotateY(0.4);
    g.computeVertexNormals();
    return g;
  }, []);
  const seeds = useMemo(() => Array.from({ length: 26 }, () => {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.48;
    const y = 0.5 - (r / 0.66) ** 2 * 0.36;
    return { p: [Math.cos(a) * r, y + 0.005, Math.sin(a) * r] as [number, number, number], ry: a };
  }), []);
  return (
    <group>
      <BlobShadow size={2.4} />
      <Turntable>
        <Layer y={0} delay={0.1}>
          <mesh geometry={bottom}>
            <meshStandardMaterial map={bunTex} roughness={0.7} />
          </mesh>
        </Layer>
        <Layer y={0.2} delay={0.4}>
          <mesh position-y={0.1}>
            <cylinderGeometry args={[0.66, 0.64, 0.2, 40]} />
            <meshStandardMaterial map={patty} bumpMap={patty} bumpScale={2} roughness={0.85} />
          </mesh>
        </Layer>
        <Layer y={0.41} delay={0.7}>
          <mesh geometry={cheese}>
            <Glossy color="#FFC53D" rough={0.35} />
          </mesh>
        </Layer>
        <Layer y={0.43} delay={1.0}>
          <mesh geometry={lettuce}>
            <meshStandardMaterial color="#5E9E3A" roughness={0.45} side={THREE.DoubleSide} />
          </mesh>
        </Layer>
        <Layer y={0.47} delay={1.25}>
          {[[-0.25, 0], [0.25, 0.05]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.03, z]}>
              <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
              <Glossy color="#D9472F" rough={0.3} />
            </mesh>
          ))}
        </Layer>
        <Layer y={0.53} delay={1.6} h={1.8}>
          <mesh geometry={top}>
            <meshPhysicalMaterial map={bunTex} roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.4} />
          </mesh>
          {seeds.map((s, i) => (
            <mesh key={i} position={s.p} rotation-y={s.ry} scale={[0.028, 0.012, 0.016]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#FFF2D6" roughness={0.5} />
            </mesh>
          ))}
        </Layer>
      </Turntable>
    </group>
  );
}

/** Three crisp samosas pop onto the plate with a chutney bowl */
export function SamosaModel({ tint }: { tint: string }) {
  const crust = useMemo(() => crumbTex(shade(tint, -0.06), "rgba(120,55,15,0.5)", `crust-${tint}`), [tint]);
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.42, 0.62, 3, 6);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const bulge = 1 + 0.18 * Math.sin(((v.y + 0.31) / 0.62) * Math.PI); // puffed pastry sides
      v.x *= bulge;
      v.z *= bulge;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    g.translate(0, 0.31, 0);
    return g;
  }, []);
  const bowl = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.12, 0], [0.2, 0.08], [0.22, 0.16], [0.2, 0.16], [0.17, 0.09], [0, 0.06]], []));
  const items: { p: [number, number, number]; r: [number, number, number] }[] = [
    { p: [-0.38, 0.06, 0.12], r: [0.25, 0.3, -0.1] },
    { p: [0.32, 0.06, 0.2], r: [-0.15, 1.4, 0.15] },
    { p: [0, 0.06, -0.32], r: [0.15, 2.2, 0.05] },
  ];
  return (
    <group>
      <BlobShadow size={2.6} />
      <Turntable speed={0.3}>
        <mesh position-y={0.02} scale={[1, 0.3, 1]}>
          <cylinderGeometry args={[1.0, 0.9, 0.12, 48]} />
          <Ceramic />
        </mesh>
        {items.map((it, i) => (
          <Layer key={i} y={it.p[1]} delay={0.15 + i * 0.35} h={1.1}>
            <mesh geometry={geo} position={[it.p[0], 0, it.p[2]]} rotation={it.r}>
              <meshStandardMaterial map={crust} bumpMap={crust} bumpScale={1.5} roughness={0.6} flatShading={false} />
            </mesh>
          </Layer>
        ))}
        <group position={[0.55, 0.05, -0.35]}>
          <mesh geometry={bowl}>
            <Ceramic color="#FFF7EE" />
          </mesh>
          <mesh position-y={0.13} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.19, 24]} />
            <Glossy color="#4E9A3F" rough={0.3} />
          </mesh>
        </group>
      </Turntable>
    </group>
  );
}

/** Golden nuggets in a paper-lined basket — they hop in turns */
export function NuggetsModel({ tint }: { tint: string }) {
  const crust = useMemo(() => crumbTex(shade(tint, -0.08), "rgba(120,55,15,0.55)", `nug-${tint}`), [tint]);
  const nuggetGeo = useMemo(() => {
    const g = smoothIco(0.2, 3);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.multiplyScalar(1 + Math.sin(v.x * 30) * Math.cos(v.z * 26) * 0.08);
      v.y *= 0.62;
      v.x *= 1.25;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const basket = useLathe(useMemo<[number, number][]>(() => [[0, 0], [0.6, 0], [0.78, 0.32], [0.76, 0.33], [0.58, 0.04], [0, 0.04]], []));
  const nuggets = useMemo(() => [[-0.25, 0.14, 0.1, 0.3], [0.2, 0.14, 0.18, 1.2], [0.05, 0.14, -0.22, 2.4], [-0.3, 0.3, -0.12, 0.8], [0.3, 0.3, -0.05, 2.0], [0, 0.34, 0.12, 3.1], [-0.05, 0.46, -0.05, 1.7]], []);
  const grp = useRef<THREE.Group>(null);
  const clock = useClock();
  useFrame(({ clock: c }) => {
    const t = clock(c.elapsedTime);
    grp.current?.children.forEach((n, i) => {
      const [x, y, z, r] = nuggets[i];
      const intro = easeBack((t - i * 0.12) / 0.6);
      const hop = Math.max(0, Math.sin(t * 2 - i * 0.9)) ** 8 * 0.22;
      n.position.set(x, y + hop + (1 - intro) * 1.2, z);
      n.rotation.set(Math.sin(r) * 0.4 + hop * 2, r, Math.cos(r) * 0.3);
      n.scale.setScalar(Math.max(0.001, Math.min(1, intro)));
    });
  });
  return (
    <group>
      <BlobShadow size={2.4} />
      <Turntable speed={0.3}>
        <mesh geometry={basket}>
          <meshStandardMaterial color="#C2283F" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={0.05} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.62, 32]} />
          <meshStandardMaterial color="#FFF7EE" roughness={0.9} />
        </mesh>
        <group ref={grp}>
          {nuggets.map((_, i) => (
            <mesh key={i} geometry={nuggetGeo}>
              <meshStandardMaterial map={crust} bumpMap={crust} bumpScale={2} roughness={0.7} />
            </mesh>
          ))}
        </group>
        <RoundedBox args={[0.32, 0.14, 0.32]} radius={0.04} position={[0.62, 0.07, 0.48]}>
          <Ceramic />
        </RoundedBox>
        <mesh position={[0.62, 0.142, 0.48]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.26, 0.26]} />
          <Glossy color="#E8B83A" rough={0.2} />
        </mesh>
      </Turntable>
    </group>
  );
}
