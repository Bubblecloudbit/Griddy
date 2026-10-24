// components/utility/usePolling.ts — fetch now, then every N ms (owner: C)
// The Overview polls so numbers update within 5 s after Jordan commits a plan.
"use client";

import { useEffect, useState } from "react";

export const POLL_MS = 5000;

export function usePolling<T>(load: () => Promise<T>, intervalMs = POLL_MS) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () =>
      load()
        .then((d) => {
          if (cancelled) return;
          setData(d);
          setError(null);
        })
        .catch((e: Error) => !cancelled && setError(e.message)); // keep showing the last good data
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [load, intervalMs]);

  return { data, error };
}
