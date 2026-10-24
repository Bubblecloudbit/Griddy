// components/ui/Button.tsx — primary (ink fill), secondary (outline), quiet (text) (DESIGN.md §3, owner: C)
// Labels are verbs: "Find best times", "Commit plan", "Create event".
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink text-surface hover:bg-ink/90 border border-ink",
  secondary: "bg-surface text-ink border border-line hover:border-ink",
  quiet: "bg-transparent text-ink border border-transparent hover:bg-paper",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-control px-3 py-2 text-body font-medium transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
