"use client";
import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** One studio reflection map per WebGL context (no HDR download), applied to whichever scene this sits in. */
const envCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

export function RoomEnv({ intensity = 1 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    let tex = envCache.get(gl);
    if (!tex) {
      const pmrem = new THREE.PMREMGenerator(gl);
      tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      envCache.set(gl, tex);
    }
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => {
      if (scene.environment === tex) scene.environment = null;
    };
  }, [gl, scene, intensity]);
  return null;
}
