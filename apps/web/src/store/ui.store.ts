import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLocale } from '../i18n/index.js';

interface UiState {
  activeWorkspaceId: string | null;
  locale: SupportedLocale;
  sidebarCollapsed: boolean;
  setActiveWorkspace: (id: string | null) => void;
  setLocale: (locale: SupportedLocale) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      locale: 'zh-CN',
      sidebarCollapsed: false,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setLocale: (locale) => set({ locale }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'contentflow-ui' }
  )
);
