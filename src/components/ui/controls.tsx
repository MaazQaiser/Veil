import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "./icons";

const control =
  "w-full rounded-md border border-border bg-surface text-foreground placeholder:text-quiet";
const focus =
  "focus-visible:outline-none focus-visible:border-foreground focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]";
const disabled = "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-disabled";
const invalid = "aria-[invalid=true]:border-destructive";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(control, focus, disabled, invalid, "h-12 px-4 text-body", className)}
      {...props}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(control, focus, disabled, invalid, "min-h-[8rem] px-4 py-3 text-body", className)}
      {...props}
    />
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          control,
          focus,
          disabled,
          invalid,
          "h-12 appearance-none px-4 pr-10 text-body",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
});
