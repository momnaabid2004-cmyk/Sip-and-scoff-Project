"use client";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import * as THREE from "three";
import type { ArtKind } from "@/lib/db/types";
import { FoodScene } from "./models";

type P = { kind: ArtKind; tint: string; still?: boolean; zoom?: number; seed?: number; progress?: React.MutableRefObject<number> };

/** A view that renders into the shared site canvas (see Stage3D) */
export function SharedFoodView(p: P) {
  return (
    <View className="absolute inset-0">
      <FoodScene {...p} />
    </View>
  );
}

/** Its own small canvas — for overlays (product sheet) that sit above the shared canvas */
export function StandaloneFoodView(p: P) {
  return (
    <Canvas
      className="!absolute !inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
      aria-hidden
    >
      <FoodScene {...p} />
    </Canvas>
  );
}
