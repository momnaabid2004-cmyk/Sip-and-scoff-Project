"use client";
import * as THREE from "three";

/** Small procedural textures (generated once on the client, cached). No image downloads needed. */
const cache = new Map<string, THREE.Texture>();

function canvasTex(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat = 1) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** soft white puff for steam sprites */
export const steamTex = () =>
  canvasTex("steam", 128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,0.9)");
    r.addColorStop(0.4, "rgba(255,255,255,0.35)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });

/** blob shadow under each model */
export const shadowTex = () =>
  canvasTex("shadow", 128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(42,24,16,0.6)");
    r.addColorStop(0.4, "rgba(42,24,16,0.22)");
    r.addColorStop(0.72, "rgba(42,24,16,0)");
    r.addColorStop(1, "rgba(42,24,16,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });

/** waffle-cone diamond grid (used as bump + colour) */
export const waffleTex = () =>
  canvasTex(
    "waffle",
    256,
    (g, s) => {
      g.fillStyle = "#d9a15a";
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "#a8692c";
      g.lineWidth = 10;
      for (let i = -s; i < s * 2; i += 42) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke();
        g.beginPath(); g.moveTo(i, s); g.lineTo(i + s, 0); g.stroke();
      }
    },
    3
  );

/** square waffle grid for Belgian waffles */
export const gridTex = () =>
  canvasTex(
    "grid",
    256,
    (g, s) => {
      g.fillStyle = "#e0a75c";
      g.fillRect(0, 0, s, s);
      g.fillStyle = "#b8762f";
      const n = 4, w = s / n;
      for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) g.fillRect(x * w + 8, y * w + 8, w - 16, w - 16);
    },
    1
  );

/** speckled noise — toast, crust, fried batter */
export const crumbTex = (base: string, dot: string, key: string) =>
  canvasTex(key, 256, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() > 0.5 ? dot : "rgba(255,255,255,0.18)";
      const r = Math.random() * 3 + 0.6;
      g.beginPath();
      g.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
      g.fill();
    }
  });

/** lime / orange wheel */
export const citrusTex = (rind: string, flesh: string, key: string) =>
  canvasTex(key, 256, (g, s) => {
    const c = s / 2;
    g.fillStyle = rind; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f8f6d8"; g.beginPath(); g.arc(c, c, c * 0.9, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 2 + 0.04, a1 = ((i + 1) / 10) * Math.PI * 2 - 0.04;
      g.fillStyle = flesh; g.beginPath(); g.moveTo(c, c); g.arc(c, c, c * 0.84, a0, a1); g.closePath(); g.fill();
    }
  });

/** can label: brand band + wordmark */
export const labelTex = (color: string, key: string) =>
  canvasTex(key, 512, (g, s) => {
    g.fillStyle = color; g.fillRect(0, 0, s, s);
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.fillRect(0, s * 0.42, s, s * 0.16);
    g.fillStyle = color;
    g.font = `italic ${s * 0.1}px Georgia, serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("Sip & Scoop", s / 2, s / 2);
  });
