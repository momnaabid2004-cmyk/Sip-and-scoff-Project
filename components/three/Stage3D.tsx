"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, createPortal, useThree } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";
import * as THREE from "three";
import { useUI } from "@/components/providers/UIProvider";
import { WarmupScene } from "./models";

const isPhone = () => typeof window !== "undefined" && window.innerWidth < 768;

/** Renders every model once into a hidden scene and compiles all shaders asynchronously, then reports ready. */
function Warmup({ onDone }: { onDone: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(26, 1, 0.1, 40);
    c.position.set(0, 1.15, 6.4);
    c.lookAt(0, 0.05, 0);
    return c;
  }, []);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    const id = requestAnimationFrame(async () => {
      try {
        if (gl.compileAsync) await gl.compileAsync(scene, camera);
        else gl.compile(scene, camera);
      } catch {
        /* compile failures are non-fatal — shaders compile lazily instead */
      }
      if (!alive) return;
      setDone(true);
      onDone();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, [gl, scene, camera, onDone]);
  return done ? null : <>{createPortal(<WarmupScene />, scene)}</>;
}

/**
 * One full-screen, click-through WebGL canvas for the whole site. Every <Food3D/> registers a drei <View/>
 * that renders into this canvas, clipped to its own box → one GPU context; offscreen views are skipped.
 * Speed: pixel ratio capped (1.25 phones / 1.5 desktop) and lowered automatically if the frame rate drops;
 * rendering pauses while the cart or product sheet covers the page.
 * Layering: canvas z-20 · sticky menu bar z-30 · navbar z-50 · drawers/modals z-70+.
 */
export default function Stage3D({ onReady }: { onReady: () => void }) {
  const { cartOpen, product } = useUI();
  const maxDpr = useRef(isPhone() ? 1.25 : 1.5);
  const [dpr, setDpr] = useState(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, maxDpr.current));
  const covered = cartOpen || !!product;
  return (
    <Canvas
      className="!fixed !inset-0 !h-[100lvh] !w-screen"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      dpr={dpr}
      frameloop={covered ? "never" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.95;
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr.current)} flipflops={3} onFallback={() => setDpr(1)} />
      <Warmup onDone={onReady} />
      <View.Port />
    </Canvas>
  );
}
