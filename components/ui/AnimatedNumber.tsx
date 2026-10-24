// components/ui/AnimatedNumber.tsx — number that eases to its new value in 300 ms (DESIGN.md §2 Motion, owner: C)
// Usage: <AnimatedNumber value={1900} format={(n) => `${fmt(n)} kWh`} />
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "./tokens";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // no bounce

export function useAnimatedNumber(target: number, durationMs: number = motion.chart): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = performance.now();
    const startValue = from.current;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const value = startValue + (target - startValue) * easeOut(t);
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}

export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  return <>{format(useAnimatedNumber(value))}</>;
}
