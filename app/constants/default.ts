export const DEFAULT_MEMOS: Record<string, any> = {
  "memo1": {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Markdown Guide & Examples" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "This is a demonstration of the " },
          { type: "text", text: "Markdown", marks: [{ type: "bold" }] },
          { type: "text", text: " capabilities in " },
          { type: "text", text: "Next Notepad", marks: [{ type: "italic" }, { type: "underline" }] },
          { type: "text", text: "." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. Text Styling" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "You can use " },
          { type: "text", text: "bold", marks: [{ type: "bold" }] },
          { type: "text", text: ", " },
          { type: "text", text: "italic", marks: [{ type: "italic" }] },
          { type: "text", text: ", " },
          { type: "text", text: "strikethrough", marks: [{ type: "strike" }] },
          { type: "text", text: ", and " },
          { type: "text", text: "highlighting", marks: [{ type: "highlight", attrs: { color: "#ffcc00" } }] },
          { type: "text", text: " to emphasize your content." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. Lists" }]
      },
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet list item 1" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet list item 2" }] }] }
        ]
      },
      {
        type: "orderedList",
        attrs: { start: 1 },
        content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First item" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Second item" }] }] }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. Task List" }]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. Code & Blocks" }]
      },
      {
        type: "codeBlock",
        attrs: { language: "javascript" },
        content: [{ type: "text", text: "function hello() {\n  console.log(\"Hello, world!\");\n}" }]
      },
      {
        type: "blockquote",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "“The best way to predict the future is to invent it.”" }] },
          { type: "paragraph", content: [{ type: "text", text: "— Alan Kay" }] }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Happy writing!" }]
      }
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
  "memo1": "MEMO",
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
