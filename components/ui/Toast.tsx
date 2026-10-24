// components/ui/Toast.tsx — bottom-center confirmation (DESIGN.md §3, owner: C)
// Usage:
//   const { showToast, toast } = useToast();
//   showToast("Plan committed · +10 GridPoints");
//   return <>{…}{toast}</>;
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-control bg-ink px-4 py-2 text-body text-surface shadow-popover"
    >
      <Check size={16} strokeWidth={1.5} aria-hidden />
      {message}
    </div>
  );
}

export function useToast(durationMs = 2500) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(
    (text: string) => {
      clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { showToast, toast: message ? <Toast message={message} /> : null };
}
