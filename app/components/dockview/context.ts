import { createContext, useContext } from "react";

export const MemoContext = createContext<{
  memos: Record<string, any>;
  titles: Record<string, string>;
  isEncrypted: boolean;
  isReadOnly: boolean;
  updateMemo: (id: string, val: any, immediate?: boolean) => void;
  updateTitle: (id: string, title: string) => void;
  removeMemo: (id: string) => void;
  resetData: (type?: "options" | "memos" | "todos" | "page" | "all") => void;
  toggleEncryption: () => void;
  setSkipSync: (skip: boolean) => void;
}>({
  memos: {},
  titles: {},
  isEncrypted: false,
  isReadOnly: false,
  updateMemo: () => { },
  updateTitle: () => { },
  removeMemo: () => { },
  resetData: () => { },
  toggleEncryption: () => { },
  setSkipSync: () => { }
});

export const useMemoStore = () => useContext(MemoContext);
