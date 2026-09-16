import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Label({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("text-label font-medium text-foreground", className)}>
      {children}
      {required ? (
        <span className="ml-1 text-destructive" aria-hidden>
          *
        </span>
      ) : null}
      {required ? <span className="sr-only"> required</span> : null}
    </label>
  );
}

/** Titled block of related fields. Used by the profile and Vael forms. */
export function FormSection({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-8 scroll-mt-24 border-t border-border-subtle pt-10 first:border-t-0 first:pt-0">
      <div>
        <h2 className="vael-h4">{title}</h2>
        {note ? <p className="mt-2 text-body-sm text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-label text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-label text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
