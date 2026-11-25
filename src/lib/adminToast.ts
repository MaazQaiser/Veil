import { useSyncExternalStore } from "react";

export type AdminToast = { id: number; message: string };

let toasts: AdminToast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: number) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

/** A short note that fades after a few seconds, so every change in the admin area says that it happened. */
export function showToast(message: string) {
  if (typeof window === "undefined") return;
  const id = nextId++;
  // At most three at once; the oldest goes first.
  toasts = [...toasts, { id, message }].slice(-3);
  emit();
  window.setTimeout(() => dismissToast(id), 4500);
}

export function useToasts() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
    () => toasts,
  );
}
