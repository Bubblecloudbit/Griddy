// components/customer/CommandBar.tsx — "Tell GridShift what you need" (owner: B)
// DESIGN.md §5.1: a command bar, not a chat. The coach proposes items as chips; nothing is
// added until the user confirms.
"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { FlexTask, Trip } from "@/lib/types";
import { Button } from "@/components/ui";
import { askCoach } from "./client";
import { taskLabel } from "./appliances";
import { clockLabel, dateLabel } from "./hours";

interface Proposal {
  key: string;
  text: string;
  task?: FlexTask;
  trip?: Trip;
}

interface Props {
  onConfirm: (tasks: FlexTask[], trips: Trip[]) => void;
}

const weekday = (iso: string) => dateLabel(iso).split(" ")[0];

function toProposals(tasks: FlexTask[] = [], trips: Trip[] = []): Proposal[] {
  return [
    ...tasks.map((t) => ({
      key: t.id,
      text: `${taskLabel(t)} · ready ${clockLabel(t.deadline)}`,
      task: { ...t, label: taskLabel(t) },
    })),
    ...trips.map((t) => ({ key: t.id, text: `Trip ${weekday(t.startDate)}–${weekday(t.endDate)}`, trip: t })),
  ];
}

export function CommandBar({ onConfirm }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await askCoach(message.trim());
      const next = toProposals(res.tasks, res.trips);
      setProposals(next);
      setPicked(new Set(next.map((p) => p.key)));
      // Nothing understood: show the coach's own reply as a hint.
      if (next.length === 0) setNote(res.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(key: string) {
    const next = new Set(picked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setPicked(next);
  }

  function confirm() {
    const chosen = proposals.filter((p) => picked.has(p.key));
    onConfirm(
      chosen.flatMap((p) => (p.task ? [p.task] : [])),
      chosen.flatMap((p) => (p.trip ? [p.trip] : [])),
    );
    setProposals([]);
    setMessage("");
  }

  return (
    <div className="space-y-2">
      <form onSubmit={submit} className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 focus-within:border-ink">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell GridShift what you need…"
          aria-label="Tell GridShift what you need"
          className="min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !message.trim()}
          aria-label="Read my request"
          className="text-ink-muted transition-colors duration-fast hover:text-ink disabled:opacity-40"
        >
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </form>

      {busy && <p className="text-caption text-ink-muted">Reading your request…</p>}
      {error && <p role="alert" className="text-caption text-danger">{error}</p>}
      {note && <p className="whitespace-pre-line text-caption text-ink-muted">{note}</p>}

      {proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-caption text-ink-muted">Add these to your plan?</p>
          <div className="flex flex-wrap gap-2">
            {proposals.map((p) => {
              const on = picked.has(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p.key)}
                  className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-caption transition-colors duration-fast ${
                    on ? "border-plan bg-plan-wash text-plan" : "border-line bg-surface text-ink-muted"
                  }`}
                >
                  {on && <Check size={14} strokeWidth={1.5} aria-hidden />}
                  {p.text}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button onClick={confirm} disabled={picked.size === 0}>Add to plan</Button>
            <Button variant="quiet" onClick={() => setProposals([])}>Dismiss</Button>
          </div>
        </div>
      )}
    </div>
  );
}
