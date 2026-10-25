// components/ui/Button.tsx — primary (brand fill), secondary (brand outline), quiet (text) (DESIGN.md §3, owner: C)
// Labels are verbs: "Find best times", "Commit plan", "Create event".
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet";

export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-body font-semibold transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-surface border border-brand hover:bg-brand-dark hover:border-brand-dark",
  secondary: "bg-surface text-brand border border-brand hover:bg-brand-wash",
  quiet: "bg-transparent text-brand border border-transparent hover:bg-brand-wash",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...rest} />;
}
