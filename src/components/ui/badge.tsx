import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const tones = {
  default: "bg-surface-muted text-foreground border-border",
  gold: "bg-accent-muted text-accent border-transparent",
  live: "bg-success-muted text-success border-transparent",
  soon: "bg-warning-muted text-warning border-transparent",
  early: "bg-accent-muted text-accent border-transparent",
  outline: "bg-transparent text-foreground border-border",
  muted: "bg-transparent text-muted border-border",
} as const;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones;
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center rounded-full border px-2.5 text-caption font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
