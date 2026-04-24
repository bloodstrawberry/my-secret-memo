"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Icon } from "@iconify/react";
import { Markdown } from "tiptap-markdown";
import { marked } from "marked";
import { useSettings } from "./settings-context";

// ── Configuration ──
const ICON_SIZE = 18;

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { settings } = useSettings();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value ? (marked.parse(value) as string) : "",
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none h-full p-8 text-[var(--foreground)] mx-auto",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && isMounted && value !== undefined) {
      const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
      if (currentMarkdown !== value) {
        editor.commands.setContent(marked.parse(value) as string);
      }
    }
  }, [value, editor, isMounted]);

  // Sync settings changes
  useEffect(() => {
    if (editor && settings) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: "prose dark:prose-invert max-w-none focus:outline-none h-full p-8 text-[var(--foreground)] mx-auto",
          },
        },
      });
    }
  }, [editor, settings]);

  if (!isMounted || !editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL을 입력하세요");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[var(--panel-bg)]">
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Toolbar */}
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

          {/* Table Controls */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              icon="material-symbols:table-chart"
              title="Insert Table"
            />
            {editor.isActive("table") && (
              <>
                <ToolbarButton
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  icon="material-symbols:add-column-before"
                  title="Add Column Before"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  icon="material-symbols:add-column-after"
                  title="Add Column After"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  icon="material-symbols:delete-column"
                  title="Delete Column"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  icon="material-symbols:add-row-before"
                  title="Add Row Before"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  icon="material-symbols:add-row-after"
                  title="Add Row After"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  icon="material-symbols:delete-row"
                  title="Delete Row"
                />
                <ToolbarButton
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  icon="material-symbols:table-rows-narrow"
                  title="Delete Table"
                />
              </>
            )}
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

        {/* Editor Area with dynamic style injection for robust settings application */}
        <div
          className="flex-1 overflow-auto custom-scrollbar cursor-text bg-[var(--panel-bg)] relative"
          onClick={() => editor.chain().focus().run()}
        >
          <style dangerouslySetInnerHTML={{ __html: `
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
