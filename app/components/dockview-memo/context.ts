import { createContext, useContext } from "react";

export const MemoContext = createContext<{
  memos: Record<string, any>;
  titles: Record<string, string>;
  isEncrypted: boolean;
  updateMemo: (id: string, val: any, immediate?: boolean) => void;
  updateTitle: (id: string, title: string) => void;
  removeMemo: (id: string) => void;
  resetData: () => void;
}>({
  memos: {},
  titles: {},
  isEncrypted: false,
  updateMemo: () => { },
  updateTitle: () => { },
  removeMemo: () => { },
  resetData: () => { }
});

export const useMemoStore = () => useContext(MemoContext);
