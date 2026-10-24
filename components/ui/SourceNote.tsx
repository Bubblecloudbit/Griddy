// components/ui/SourceNote.tsx — where a real number came from (DESIGN.md §3, owner: C)
// Renders: "Source: PJM Data Miner 2 · Hourly load forecast · AEP zone · retrieved Oct 24, 2026"
import { ExternalLink } from "lucide-react";

interface Props {
  source: string; // "PJM Data Miner 2"
  details?: string[]; // ["Hourly load forecast", "AEP zone"]
  retrieved?: string; // "Oct 24, 2026"
  href?: string;
}

export function SourceNote({ source, details = [], retrieved, href }: Props) {
  const parts = [source, ...details, retrieved && `retrieved ${retrieved}`].filter(Boolean);
  const text = `Source: ${parts.join(" · ")}`;
  if (!href) return <p className="text-caption text-ink-muted">{text}</p>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink"
    >
      {text}
      <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
    </a>
  );
}
