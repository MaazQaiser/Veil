import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { IconLoader } from "./icons";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed border border-transparent",
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:bg-surface-muted",
  outline:
    "bg-secondary text-secondary-foreground border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-foreground border border-transparent hover:bg-surface-muted",
  destructive:
    "bg-destructive-muted text-destructive border border-transparent hover:opacity-90",
} as const;

const sizes = {
  sm: "h-12 px-5 text-button gap-2",
  md: "h-12 px-5 text-button gap-2",
  lg: "h-12 px-5 text-button gap-2",
} as const;

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-sans font-medium",
    "motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
    "disabled:cursor-not-allowed disabled:text-disabled disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, type = "button", ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...props}
    >
      {loading ? <IconLoader className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, variant = "ghost", size = "md", loading, disabled, children, type = "button", ...props },
  ref,
) {
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        dim,
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <IconLoader className="h-4 w-4" /> : children}
    </button>
  );
});
