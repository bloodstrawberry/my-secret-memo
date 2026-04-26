import { create } from 'zustand';

interface LoadingOverlayState {
  /** Whether the loading overlay is visible */
  isLoading: boolean;
  /** Optional message to display under the spinner */
  message: string | null;
  show: (message?: string) => void;
  hide: () => void;
}

export const useLoadingOverlay = create<LoadingOverlayState>()((set) => ({
  isLoading: false,
  message: null,
  show: (message?: string) => set({ isLoading: true, message: message ?? null }),
  hide: () => set({ isLoading: false, message: null }),
}));
