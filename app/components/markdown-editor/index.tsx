"use client";

import { useRef } from "react";
import { EditorContent } from "@tiptap/react";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { MarkdownEditorProps } from "./types";
import { Toolbar } from "./toolbar";
import { EditorStyles } from "./editor-styles";
import { useEditorConfig } from "./use-editor-config";

export function MarkdownEditor(props: MarkdownEditorProps) {
  const { panelId, readOnly } = props;
  const { toolbarVisibility } = useVisualToggleStore();
  const isToolbarVisible = panelId ? toolbarVisibility[panelId] !== false : true;

  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  const { editor, isMounted, settings } = useEditorConfig(props);

  if (!isMounted || !editor) {
    return null;
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[var(--panel-bg)]">
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Toolbar */}
        {isToolbarVisible && !readOnly && (
          <Toolbar
            editor={editor}
            colorInputRef={colorInputRef}
            highlightInputRef={highlightInputRef}
          />
        )}

        {/* Read-only indicator */}
        {readOnly && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            읽기 전용
          </div>
        )}

        {/* Editor Area with dynamic style injection for robust settings application */}
        <div
          className="flex-1 overflow-auto custom-scrollbar cursor-text bg-[var(--panel-bg)] relative"
          onClick={() => editor.chain().focus().run()}
        >
          <EditorStyles settings={settings} />
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
}
