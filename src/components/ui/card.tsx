import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  variant = "functional",
  ...props
}: HTMLAttributes<HTMLElement> & { variant?: "functional" | "editorial" }) {
  return (
    <article
      className={cn(
        "rounded-xl p-5 text-foreground md:rounded-2xl md:p-6",
        variant === "editorial"
          ? "border border-transparent bg-surface-muted"
          : "border border-border bg-surface shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("vael-h4", className)} {...props} />;
}

export function CardMeta({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("text-caption text-muted", className)}>{children}</p>;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-body-sm", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-wrap items-center gap-2", className)} {...props} />;
}
