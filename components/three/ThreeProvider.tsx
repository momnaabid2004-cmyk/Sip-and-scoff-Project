"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ComponentType } from "react";

type ThreeState = { ready: boolean; reduced: boolean };
const Ctx = createContext<ThreeState>({ ready: false, reduced: false });
export const useThreeStage = () => useContext(Ctx);

type StageProps = { onReady: () => void };

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Run `fn` once the page has finished loading and the browser is idle (never delays first paint). */
function whenIdle(fn: () => void) {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(() => !cancelled && fn(), { timeout: 1200 });
    else setTimeout(() => !cancelled && fn(), 200);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
  };
}

/**
 * Speed-first 3D loading:
 *  1. The page renders instantly with lightweight 2D illustrations (server HTML, no WebGL).
 *  2. After the page has loaded and the browser is idle, the 3D code is downloaded in the background.
 *  3. The shared canvas mounts and pre-compiles every material once (off the scroll path).
 *  4. Only then do the 3D models swap in — so scrolling never stutters on shader compilation.
 * Without WebGL the 2D illustrations simply stay.
 */
export function ThreeProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);
  const [Stage, setStage] = useState<ComponentType<StageProps> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    if (!webglOK()) return () => mq.removeEventListener("change", onMq);
    const cancel = whenIdle(() => {
      // load the stage and the models together so the swap happens in one go
      Promise.all([import("./Stage3D"), import("./FoodView")])
        .then(([stage]) => setStage(() => stage.default))
        .catch(() => {});
    });
    return () => {
      cancel();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  return (
    <Ctx.Provider value={{ ready, reduced }}>
      {children}
      {Stage && <Stage onReady={onReady} />}
    </Ctx.Provider>
  );
}
