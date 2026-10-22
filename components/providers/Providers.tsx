"use client";
import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { SmoothScrollProvider } from "./SmoothScroll";
import { CartProvider } from "./CartProvider";
import { UIProvider } from "./UIProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        <CartProvider>
          <UIProvider>{children}</UIProvider>
        </CartProvider>
      </SmoothScrollProvider>
    </MotionConfig>
  );
}
