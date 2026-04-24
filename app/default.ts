export const DEFAULT_MEMOS: Record<string, string> = {
  "memo1": "# MEMO1\n여기에 첫 번째 메모를 작성하세요.",
  "memo2": "# MEMO2\n여기에 두 번째 메모를 작성하세요.",
  "memo3": "# MEMO3\n여기에 세 번째 메모를 작성하세요.",
};

export const DEFAULT_TITLES: Record<string, string> = {
  "memo1": "MEMO1",
  "memo2": "MEMO2",
  "memo3": "MEMO3",
};

export const STORAGE_KEYS = {
  MEMOS: "my-secret-memos-v2",
  TITLES: "my-secret-memo-titles",
  LAYOUT: "dockview-layout-v1",
  SETTINGS: "memo-editor-settings",
  THEME: "theme",
};
