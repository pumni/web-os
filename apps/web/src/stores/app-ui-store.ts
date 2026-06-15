import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { SIDEBAR_COOKIE } from '@/components/app-shell/sidebar-config';

function readCollapsedCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').includes(`${SIDEBAR_COOKIE}=1`);
}

function writeCollapsedCookie(collapsed: boolean): void {
  if (typeof document === 'undefined') return;
  // Non-sensitive UI preference; 1-year lifetime, lax so the server layout can
  // read it for zero-flash SSR.
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
}

type AppUiState = {
  /** Mobile drawer (off-canvas) open state. */
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  /** Desktop rail collapsed (icon-only) state. Persisted via cookie. */
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
};

export const useAppUiStore = create<AppUiState>((set) => ({
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isSidebarCollapsed: readCollapsedCookie(),
  setSidebarCollapsed: (collapsed) => {
    writeCollapsedCookie(collapsed);
    set({ isSidebarCollapsed: collapsed });
  },
  toggleSidebarCollapsed: () =>
    set((state) => {
      const next = !state.isSidebarCollapsed;
      writeCollapsedCookie(next);
      return { isSidebarCollapsed: next };
    }),
}));

/**
 * Hydration-safe read of the persisted collapse preference. `serverDefault` is
 * the value the server read from the cookie; `useSyncExternalStore` renders it
 * for the first paint (matching SSR), and the client store — also seeded from
 * the same cookie — yields the identical value, so there is no flash.
 */
export function useSidebarCollapsed(serverDefault: boolean): boolean {
  return useSyncExternalStore(
    useAppUiStore.subscribe,
    () => useAppUiStore.getState().isSidebarCollapsed,
    () => serverDefault,
  );
}
