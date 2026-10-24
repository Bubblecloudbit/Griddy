// components/ui/EmptyState.tsx — small line icon, one sentence, one action (DESIGN.md §3, owner: C)
import { Inbox, type LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface Props {
  message: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, icon: Icon = Inbox, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="text-ink-muted">
        <Icon size={16} strokeWidth={1.5} />
      </span>
      <p className="text-body text-ink-muted">{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
