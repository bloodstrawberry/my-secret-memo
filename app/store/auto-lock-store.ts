import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AutoLockState {
  /** Whether auto-lock mode is enabled (persisted) */
  autoLockEnabled: boolean;
  /** The encryption key — held in memory only, NEVER persisted */
  sessionKey: string | null;
  setAutoLockEnabled: (enabled: boolean) => void;
  setSessionKey: (key: string | null) => void;
}

export const useAutoLockStore = create<AutoLockState>()(
  persist(
    (set) => ({
      autoLockEnabled: false,
      sessionKey: null,
      setAutoLockEnabled: (enabled: boolean) => set({ autoLockEnabled: enabled }),
      setSessionKey: (key: string | null) => set({ sessionKey: key }),
    }),
    {
      name: 'auto-lock-storage',
      // Only persist autoLockEnabled — sessionKey must never be persisted
      partialize: (state) => ({ autoLockEnabled: state.autoLockEnabled }),
    }
  )
);
