"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Icon } from "@iconify/react";
import { Markdown } from "tiptap-markdown";
import { useSettings } from "./settings-context";
import { useVisualToggleStore } from "./visual-toggle-store";
import { toast } from "./toast";
import { debounce } from "es-toolkit";

// ── Configuration ──
const ICON_SIZE = 18;
const EDITOR_PADDING = "p-4"; // 그림에 보이는 간격을 조절하는 변수 (p-8 -> p-4로 변경)


// Editor content is stored as tiptap JSON for lossless persistence
type EditorJSON = Record<string, any>;

interface MarkdownEditorProps {
  value: EditorJSON | string;
  onChange: (value: EditorJSON) => void;
  onBlur?: (value: EditorJSON) => void;
  placeholder?: string;
  panelId?: string;
}

export default function MarkdownEditor({ value, onChange, onBlur, placeholder, panelId }: MarkdownEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { settings } = useSettings();
  const { toolbarVisibility } = useVisualToggleStore();
  const isToolbarVisible = panelId ? toolbarVisibility[panelId] !== false : true;

  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track the last value we sent to the parent to distinguish between internal and external changes
  const lastSentValueRef = useRef<string>(JSON.stringify(value));
  const lastEmitTimeRef = useRef<number>(Date.now());

  // Debounced version of onChange to avoid constant parent re-renders
  const debouncedOnChange = useRef(
    debounce((val: EditorJSON) => {
      lastSentValueRef.current = JSON.stringify(val);
      lastEmitTimeRef.current = Date.now();
      onChange(val);
    }, 600)
  ).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: "tight",
        bulletListMarker: "-",
        linkify: true,
        breaks: true,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "상세 내용을 입력하세요...",
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const now = Date.now();

      // If more than 2.5 seconds passed since last emit, force an update (maxWait)
      if (now - lastEmitTimeRef.current >= 2500) {
        debouncedOnChange.cancel();
        lastSentValueRef.current = JSON.stringify(json);
        lastEmitTimeRef.current = now;
        onChange(json);
      } else {
        debouncedOnChange(json);
      }
    },
    onBlur: ({ editor }) => {
      const json = editor.getJSON();
      debouncedOnChange.cancel();
      lastSentValueRef.current = JSON.stringify(json);
      onBlur?.(json);
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none h-full ${EDITOR_PADDING} text-[var(--foreground)] mx-auto`,
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (compare by JSON string to avoid unnecessary updates)
  useEffect(() => {
    if (editor && isMounted && value !== undefined) {
      const incomingJSON = typeof value === 'string' ? value : JSON.stringify(value);
      const currentJSON = JSON.stringify(editor.getJSON());

      // ONLY set content if the incoming value is different from current editor content
      // AND it's different from the last value we sent to the parent (meaning it's an external change)
      if (incomingJSON !== currentJSON && incomingJSON !== lastSentValueRef.current) {
        editor.commands.setContent(value);
        lastSentValueRef.current = incomingJSON;
      }
    }
  }, [value, editor, isMounted]);

  // Sync settings changes
  useEffect(() => {
    if (editor && settings) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose dark:prose-invert max-w-none focus:outline-none h-full ${EDITOR_PADDING} text-[var(--foreground)] mx-auto`,
          },
        },
      });
    }
  }, [editor, settings]);

  if (!isMounted || !editor) {
    return null;
  }

  const addLink = () => {
    toast.prompt("URL을 입력하세요", (url) => {
      if (url) {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }
    }, { placeholder: "https://..." });
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[var(--panel-bg)]">
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Toolbar */}
        {isToolbarVisible && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-sm sticky top-0 z-10">
            {/* Headings Dropdown */}
            <div className="flex items-center gap-1">
              <select
                className="bg-transparent text-[var(--foreground)] text-xs font-medium px-2 py-1 rounded-md border border-[var(--border-color)] outline-none hover:bg-slate-500/5 focus:ring-1 focus:ring-cyan-500/30 cursor-pointer transition-all duration-200"
                value={
                  editor.isActive("heading", { level: 1 }) ? "1" :
                    editor.isActive("heading", { level: 2 }) ? "2" :
                      editor.isActive("heading", { level: 3 }) ? "3" :
                        editor.isActive("heading", { level: 4 }) ? "4" :
                          editor.isActive("heading", { level: 5 }) ? "5" :
                            editor.isActive("heading", { level: 6 }) ? "6" :
                              "p"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "p") {
                    editor.chain().focus().setParagraph().run();
                  } else {
                    editor.chain().focus().toggleHeading({ level: parseInt(value) as any }).run();
                  }
                }}
              >
                <option value="p" className="bg-[var(--panel-bg)] text-[var(--foreground)]">본문</option>
                <option value="1" className="bg-[var(--panel-bg)] text-[var(--foreground)]">H1</option>
                <option value="2" className="bg-[var(--panel-bg)] text-[var(--foreground)]">H2</option>
                <option value="3" className="bg-[var(--panel-bg)] text-[var(--foreground)]">H3</option>
                <option value="4" className="bg-[var(--panel-bg)] text-[var(--foreground)]">H4</option>
                <option value="5" className="bg-[var(--panel-bg)] text-[var(--foreground)]">H5</option>
                <option value="6" className="bg-[var(--panel-bg)] text-[var(--foreground)]">H6</option>
              </select>
            </div>

            <ToolbarDivider />

            {/* Basic Formatting */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                icon="material-symbols:format-bold"
                title="Bold"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                icon="material-symbols:format-italic"
                title="Italic"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                icon="material-symbols:format-underlined"
                title="Underline"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive("strike")}
                icon="material-symbols:strikethrough-s"
                title="Strikethrough"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                active={editor.isActive("code")}
                icon="material-symbols:code"
                title="Code Inline"
              />
            </div>

            <ToolbarDivider />

            {/* Color & Highlight */}
            <div className="flex items-center gap-1">
              <div className="relative group">
                <ToolbarButton
                  onClick={() => colorInputRef.current?.click()}
                  active={editor.isActive("textStyle", { color: editor.getAttributes("textStyle").color })}
                  icon="material-symbols:format-color-text"
                  title="Text Color"
                />
                <input
                  ref={colorInputRef}
                  type="color"
                  className="invisible absolute w-0 h-0"
                  onInput={(event) => {
                    editor.chain().focus().setColor((event.target as HTMLInputElement).value).run();
                  }}
                />
              </div>
              <div className="relative group">
                <ToolbarButton
                  onClick={() => highlightInputRef.current?.click()}
                  active={editor.isActive("highlight")}
                  icon="material-symbols:format-ink-highlighter"
                  title="Highlight"
                />
                <input
                  ref={highlightInputRef}
                  type="color"
                  className="invisible absolute w-0 h-0"
                  onInput={(event) => {
                    editor.chain().focus().toggleHighlight({ color: (event.target as HTMLInputElement).value }).run();
                  }}
                />
              </div>
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}
                icon="material-symbols:format-color-reset"
                title="Reset Color"
              />
            </div>

            <ToolbarDivider />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                icon="material-symbols:format-list-bulleted"
                title="Bullet List"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                icon="material-symbols:format-list-numbered"
                title="Numbered List"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                active={editor.isActive("taskList")}
                icon="material-symbols:checklist"
                title="Task List"
              />
            </div>

            <ToolbarDivider />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                active={editor.isActive({ textAlign: "left" })}
                icon="material-symbols:format-align-left"
                title="Align Left"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                active={editor.isActive({ textAlign: "center" })}
                icon="material-symbols:format-align-center"
                title="Align Center"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                active={editor.isActive({ textAlign: "right" })}
                icon="material-symbols:format-align-right"
                title="Align Right"
              />
            </div>

            <ToolbarDivider />

            {/* Misc */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
                icon="material-symbols:format-quote"
                title="Quote"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive("codeBlock")}
                icon="material-symbols:terminal"
                title="Code Block"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                icon="material-symbols:horizontal-rule"
                title="Horizontal Rule"
              />
              <ToolbarButton
                onClick={addLink}
                active={editor.isActive("link")}
                icon="material-symbols:link"
                title="Link"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                icon="material-symbols:format-clear"
                title="Clear Formatting"
              />
            </div>

          </div>
        )}

        {/* Editor Area with dynamic style injection for robust settings application */}
        <div
          className="flex-1 overflow-auto custom-scrollbar cursor-text bg-[var(--panel-bg)] relative"
          onClick={() => editor.chain().focus().run()}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            .tiptap.prose {
              font-family: ${settings.fontFamily} !important;
              font-size: ${settings.fontSize} !important;
              line-height: ${settings.lineHeight} !important;
              letter-spacing: ${settings.letterSpacing} !important;
              max-width: ${settings.maxWidth} !important;
              transition: none !important;
            }
            /* Ensure all children inherit the font-family */
            .tiptap.prose * {
              font-family: inherit !important;
            }
            .tiptap.prose hr {
              margin: 2em 0 !important;
              border: 0 !important;
              border-top: 1px solid var(--hr-color, #000000) !important;
              opacity: 1 !important;
            }
            /* Specific overrides for common prose elements if needed */
            .tiptap.prose p, .tiptap.prose h1, .tiptap.prose h2, .tiptap.prose h3, .tiptap.prose li {
              font-family: inherit !important;
            }
          ` }} />
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon,
  title,
  disabled
}: {
  onClick: () => void;
  active?: boolean;
  icon: string;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`
        p-1 rounded-lg transition-all duration-200
        ${active
          ? "bg-cyan-500/15 text-cyan-500 shadow-sm ring-1 ring-cyan-500/30"
          : "text-[var(--foreground)] opacity-60 hover:opacity-100 hover:bg-slate-500/10"}
        ${disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <Icon icon={icon} width={ICON_SIZE} height={ICON_SIZE} />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-[var(--border-color)] self-center opacity-30" />;
}
