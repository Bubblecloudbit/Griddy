// components/utility/usePolling.ts — fetch now, then every N ms (owner: C)
// The Overview polls so numbers update within 5 s after Jordan commits a plan.
// Pass a stable `load` (useCallback); when it changes (e.g. a new area), data resets.
"use client";

import { useEffect, useState } from "react";

export const POLL_MS = 5000;

export function usePolling<T>(load: () => Promise<T>, intervalMs = POLL_MS) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    const tick = () =>
      load()
        .then((d) => {
          if (cancelled) return;
          setData(d);
          setError(null);
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setError(e); // keep showing the last good data, if any
        });
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [load, intervalMs]);

  return { data, error };
}
