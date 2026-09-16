import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "vael_theme_v1";
const ACCENT_STORAGE_KEY = "vael_theme_accent_v1";

export type Theme = "light" | "dark";
export type Accent = "orange" | "yellow";

function readTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function writeTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

function readAccent(): Accent {
  try {
    return localStorage.getItem(ACCENT_STORAGE_KEY) === "yellow" ? "yellow" : "orange";
  } catch {
    return "orange";
  }
}

function writeAccent(accent: Accent) {
  localStorage.setItem(ACCENT_STORAGE_KEY, accent);
}

type Ctx = {
  theme: Theme;
  toggleTheme: () => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (typeof window === "undefined" ? "light" : readTheme()));
  const [accent, setAccentState] = useState<Accent>(() => (typeof window === "undefined" ? "orange" : readAccent()));

  const value = useMemo<Ctx>(
    () => ({
      theme,
      toggleTheme: () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        writeTheme(next);
      },
      accent,
      setAccent: (next) => {
        setAccentState(next);
        writeAccent(next);
      },
    }),
    [theme, accent],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
