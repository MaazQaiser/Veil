import { createContext, useContext, useId, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TabsCtx = { value: string; setValue: (v: string) => void; id: string };
const TabsContext = createContext<TabsCtx | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  return (
    <TabsContext.Provider
      value={{
        value: current,
        setValue: (next) => {
          setInternal(next);
          onValueChange?.(next);
        },
        id,
      }}
    >
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("flex flex-wrap gap-1 border-b border-border", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const tabs = useTabs();
  const selected = tabs.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.id}-${value}`}
      aria-selected={selected}
      aria-controls={`${tabs.id}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cn(
        "-mb-px border-b px-3 py-3 text-button font-medium motion-safe:transition-colors motion-safe:duration-150",
        selected
          ? "border-foreground text-foreground dark:border-accent dark:text-accent"
          : "border-transparent text-muted hover:text-foreground",
        className,
      )}
      onClick={() => tabs.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const tabs = useTabs();
  if (tabs.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${tabs.id}-panel-${value}`}
      aria-labelledby={`${tabs.id}-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}
