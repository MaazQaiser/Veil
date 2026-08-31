import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type BoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, BoxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  const inputId = id ?? (typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <label htmlFor={inputId} className="inline-flex items-start gap-2 text-body-sm text-foreground">
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 rounded-sm border-border text-primary accent-primary",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});

export const Radio = forwardRef<HTMLInputElement, BoxProps>(function Radio(
  { className, label, id, ...props },
  ref,
) {
  const inputId = id ?? (typeof label === "string" ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <label htmlFor={inputId} className="inline-flex items-start gap-2 text-body-sm text-foreground">
      <input
        ref={ref}
        id={inputId}
        type="radio"
        className={cn(
          "mt-0.5 h-4 w-4 border-border text-primary accent-primary",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});

export type SwitchProps = {
  label: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange">;

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, label, checked, disabled, onCheckedChange, id, name, ...props },
  ref,
) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const isOn = Boolean(checked);
  const labelId = `${switchId}-label`;
  return (
    <div className="inline-flex items-center gap-2">
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-labelledby={labelId}
        disabled={disabled}
        name={name}
        className={cn(
          "relative h-6 w-10 rounded-full border transition-colors",
          isOn ? "border-primary bg-primary" : "border-border bg-surface-muted",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onClick={() => {
          if (disabled) return;
          onCheckedChange?.(!isOn);
        }}
        {...props}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-surface-elevated shadow-sm transition-transform",
            isOn ? "left-5" : "left-0.5",
          )}
        />
      </button>
      <span id={labelId} className="text-body-sm">
        {label}
      </span>
    </div>
  );
});
