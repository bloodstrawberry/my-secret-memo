import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VisualToggleState {
  toolbarVisibility: Record<string, boolean>;
  toggleToolbarVisibility: (panelId: string) => void;
}

export const useVisualToggleStore = create<VisualToggleState>()(
  persist(
    (set) => ({
      toolbarVisibility: {},
      toggleToolbarVisibility: (panelId: string) =>
        set((state) => ({
          toolbarVisibility: {
            ...state.toolbarVisibility,
            [panelId]: state.toolbarVisibility[panelId] === false ? true : false,
          },
        })),
    }),
    {
      name: 'visual-toggle-storage',
    }
  )
);
