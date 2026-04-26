import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VisualToggleState {
  toolbarVisibility: Record<string, boolean>;
  toggleToolbarVisibility: (panelId: string) => void;
  tabLocks: Record<string, string>; // panelId -> hashed password
  lockedTabs: Record<string, boolean>; // panelId -> is locked
  tabSessionPasswords: Record<string, string>; // panelId -> plain password (IN MEMORY ONLY)
  setTabLock: (panelId: string, passwordHash: string | null, plainPassword?: string) => void;
  toggleTabLock: (panelId: string, value: boolean) => void;
}

export const useVisualToggleStore = create<VisualToggleState>()(
  persist(
    (set) => ({
      toolbarVisibility: {},
      tabLocks: {},
      lockedTabs: {},
      tabSessionPasswords: {},
      toggleToolbarVisibility: (panelId: string) =>
        set((state) => ({
          toolbarVisibility: {
            ...state.toolbarVisibility,
            [panelId]: state.toolbarVisibility[panelId] === false ? true : false,
          },
        })),
      setTabLock: (panelId, passwordHash, plainPassword) =>
        set((state) => {
          const newTabLocks = { ...state.tabLocks };
          const newSessionPasswords = { ...state.tabSessionPasswords };
          if (passwordHash === null) {
            delete newTabLocks[panelId];
            delete newSessionPasswords[panelId];
          } else {
            newTabLocks[panelId] = passwordHash;
            if (plainPassword) {
              newSessionPasswords[panelId] = plainPassword;
            }
          }
          return { tabLocks: newTabLocks, tabSessionPasswords: newSessionPasswords };
        }),
      toggleTabLock: (panelId, value) =>
        set((state) => ({
          lockedTabs: {
            ...state.lockedTabs,
            [panelId]: value,
          },
        })),
    }),
    {
      name: 'visual-toggle-storage',
      // Only persist visibility, locks, and locked states. 
      // NEVER persist tabSessionPasswords.
      partialize: (state) => ({ 
        toolbarVisibility: state.toolbarVisibility,
        tabLocks: state.tabLocks,
        lockedTabs: state.lockedTabs,
      }),
    }
  )
);
