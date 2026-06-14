"use client";

import * as React from "react";

export type Accent = "cyan" | "indigo" | "violet" | "rose";
export type GlassLevel = "soft" | "default" | "strong";

// `cyan` is the brand default (no root attribute); `indigo` is kept as the
// previous brand hue, now a selectable accent.
export const ACCENTS: readonly Accent[] = ["cyan", "indigo", "violet", "rose"];
export const GLASS_LEVELS: readonly GlassLevel[] = ["soft", "default", "strong"];

type PersonalizationContextValue = {
  accent: Accent;
  glass: GlassLevel;
  setAccent: (accent: Accent) => void;
  setGlass: (glass: GlassLevel) => void;
};

const PersonalizationContext = React.createContext<PersonalizationContextValue | null>(null);

export const ACCENT_KEY = "pumni-accent";
export const GLASS_KEY = "pumni-glass";

// Accent/glass values that set a root attribute (the defaults — cyan / default —
// are represented by the ABSENCE of the attribute, matching the provider effects).
const ATTR_ACCENTS = ACCENTS.filter((accent) => accent !== "cyan");
const ATTR_GLASS = GLASS_LEVELS.filter((level) => level !== "default");

/*
 * Pre-paint personalization script.
 * next-themes injects its own blocking script for `.dark`, but accent/glass are
 * only applied in the provider's `useEffect` (post-mount) — so a user who picked
 * violet/rose or soft/strong glass would see a flash of the default at first
 * paint. This static IIFE reads localStorage and reflects the attributes onto
 * <html> synchronously, BEFORE the body paints. It mirrors `readStored` + the
 * provider's reflect effects. Static, build-time content (no user input); wrapped
 * in try/catch so a storage error never breaks the page.
 */
const PERSONALIZATION_SCRIPT =
  `(function(){try{var d=document.documentElement;` +
  `var a=localStorage.getItem(${JSON.stringify(ACCENT_KEY)});` +
  `if(${JSON.stringify(ATTR_ACCENTS)}.indexOf(a)>-1){d.setAttribute("data-accent",a)}else{d.removeAttribute("data-accent")}` +
  `var g=localStorage.getItem(${JSON.stringify(GLASS_KEY)});` +
  `if(${JSON.stringify(ATTR_GLASS)}.indexOf(g)>-1){d.setAttribute("data-glass",g)}else{d.removeAttribute("data-glass")}` +
  `}catch(e){}})();`;

/**
 * Inline blocking script that applies stored accent/glass to <html> before first
 * paint. Render it as the FIRST child of <body> (inside a root layout whose <html>
 * carries `suppressHydrationWarning`). Pairs with `PersonalizationProvider`.
 */
function PersonalizationScript() {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: PERSONALIZATION_SCRIPT }} />;
}

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key) as T | null;
  return value && allowed.includes(value) ? value : fallback;
}

function PersonalizationProvider({
  children,
  defaultAccent = "cyan",
  defaultGlass = "default",
}: {
  children: React.ReactNode;
  defaultAccent?: Accent;
  defaultGlass?: GlassLevel;
}) {
  const [accent, setAccentState] = React.useState<Accent>(defaultAccent);
  const [glass, setGlassState] = React.useState<GlassLevel>(defaultGlass);

  // Hydrate from storage after mount so SSR and the first client render match.
  React.useEffect(() => {
    setAccentState(readStored(ACCENT_KEY, ACCENTS, defaultAccent));
    setGlassState(readStored(GLASS_KEY, GLASS_LEVELS, defaultGlass));
  }, [defaultAccent, defaultGlass]);

  // Reflect onto the root element — the same node next-themes flags `.dark`.
  React.useEffect(() => {
    const root = document.documentElement;
    if (accent === "cyan") root.removeAttribute("data-accent");
    else root.setAttribute("data-accent", accent);
  }, [accent]);

  React.useEffect(() => {
    const root = document.documentElement;
    if (glass === "default") root.removeAttribute("data-glass");
    else root.setAttribute("data-glass", glass);
  }, [glass]);

  const setAccent = React.useCallback((next: Accent) => {
    setAccentState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(ACCENT_KEY, next);
  }, []);

  const setGlass = React.useCallback((next: GlassLevel) => {
    setGlassState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(GLASS_KEY, next);
  }, []);

  const value = React.useMemo<PersonalizationContextValue>(
    () => ({ accent, glass, setAccent, setGlass }),
    [accent, glass, setAccent, setGlass],
  );

  return (
    <PersonalizationContext.Provider value={value}>{children}</PersonalizationContext.Provider>
  );
}

function usePersonalization() {
  const context = React.useContext(PersonalizationContext);
  if (!context) {
    throw new Error("usePersonalization must be used within a PersonalizationProvider");
  }
  return context;
}

export { PersonalizationProvider, PersonalizationScript, usePersonalization };
