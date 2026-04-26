import { create } from 'zustand';

interface HistoryState {
  /** The date currently being viewed (null = today / live mode) */
  viewingDate: string | null;
  /** Whether the app is in read-only history mode */
  isReadOnly: boolean;
  /** Set the viewing date (null to return to live) */
  setViewingDate: (date: string | null) => void;
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  viewingDate: null,
  isReadOnly: false,
  setViewingDate: (date: string | null) => set({
    viewingDate: date,
    isReadOnly: date !== null,
  }),
}));
