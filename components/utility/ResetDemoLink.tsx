// components/utility/ResetDemoLink.tsx — hidden demo reset (added by A for BUILD.md A9, approved for C's page)
// Nearly invisible until hovered. Double-click so a stray click mid-demo can't wipe the state.
"use client";

import { useState } from "react";

export function ResetDemoLink() {
  const [resetting, setResetting] = useState(false);

  async function reset() {
    setResetting(true);
    await fetch("/api/reset", { method: "POST" });
    window.location.reload(); // re-poll everything from the seeded state
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onDoubleClick={reset}
        title="Double-click to restore the seeded demo state"
        className="text-caption text-ink-muted opacity-20 transition-opacity duration-fast hover:opacity-100"
      >
        {resetting ? "Resetting…" : "Reset demo"}
      </button>
    </div>
  );
}
