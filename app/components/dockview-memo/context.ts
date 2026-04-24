import { createContext, useContext } from "react";

export const MemoContext = createContext<{
  memos: Record<string, any>;
  titles: Record<string, string>;
  updateMemo: (id: string, val: any, immediate?: boolean) => void;
  updateTitle: (id: string, title: string) => void;
  removeMemo: (id: string) => void;
  resetData: () => void;
}>({
  memos: {},
  titles: {},
  updateMemo: () => { },
  updateTitle: () => { },
  removeMemo: () => { },
  resetData: () => { }
});

export const useMemoStore = () => useContext(MemoContext);
