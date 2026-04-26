export const DEFAULT_MEMOS: Record<string, any> = {
  "memo1": {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "MEMO1" }] },
      { type: "paragraph", content: [{ type: "text", text: "여기에 첫 번째 메모를 작성하세요." }] },
    ],
  },
  "todo1": {
    items: [
      { id: "todo-1", text: "Next Notepad 사용해보기", completed: true },
      { id: "todo-2", text: "새로운 메모 작성하기", completed: false },
      { id: "todo-3", text: "보안 기능 확인하기 (Auto Lock)", completed: false },
    ],
  },
  "spreadsheet1": [
    {
      name: "Sheet1",
      celldata: [
        { r: 0, c: 0, v: { m: "가계부 항목", v: "가계부 항목", ct: { fa: "General", t: "g" } } },
        { r: 0, c: 1, v: { m: "금액", v: "금액", ct: { fa: "General", t: "g" } } },
        { r: 1, c: 0, v: { m: "식비", v: "식비", ct: { fa: "General", t: "g" } } },
        { r: 1, c: 1, v: { m: "15000", v: "15000", ct: { fa: "General", t: "g" } } },
        { r: 2, c: 0, v: { m: "교통비", v: "교통비", ct: { fa: "General", t: "g" } } },
        { r: 2, c: 1, v: { m: "3000", v: "3000", ct: { fa: "General", t: "g" } } },
        { r: 3, c: 0, v: { m: "총합", v: "총합", ct: { fa: "General", t: "g" } } },
        { r: 3, c: 1, v: { m: "18000", v: "18000", f: "=SUM(B2:B3)", ct: { fa: "General", t: "g" } } }
      ],
      status: 1
    }
  ],
};

export const DEFAULT_TITLES: Record<string, string> = {
  "memo1": "MEMO1",
  "todo1": "TO-DO LIST",
  "spreadsheet1": "SPREADSHEET",
};

export const STORAGE_KEYS = {
  MEMOS: "my-secret-memos-v2",
  TITLES: "my-secret-memo-titles",
  LAYOUT: "dockview-layout-v1",
  SETTINGS: "memo-editor-settings",
  THEME: "theme",
};
