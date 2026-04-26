import { Editor } from "@tiptap/react";

export type EditorJSON = Record<string, any>;

export interface MarkdownEditorProps {
  value: EditorJSON | string;
  onChange: (value: EditorJSON) => void;
  onBlur?: (value: EditorJSON) => void;
  placeholder?: string;
  panelId?: string;
  readOnly?: boolean;
}

export const ICON_SIZE = 18;
export const EDITOR_PADDING = "p-4";
