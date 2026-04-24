"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Icon } from "@iconify/react";
import { Markdown } from "tiptap-markdown";
import { marked } from "marked";

// ── Configuration ──
const ICON_SIZE = 18; // 아이콘 크기 (픽셀 단위)

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

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
        // We disable the built-in code block because we might want to use something else 
        // or just let Markdown extension handle it.
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
    ],
    content: value ? (marked.parse(value) as string) : "",
    onUpdate: ({ editor }) => {
      // Get markdown directly from the editor thanks to tiptap-markdown
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none h-full p-8 text-[var(--foreground)]",
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
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-sm">
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

          <ToolbarDivider />

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

          <ToolbarDivider />

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

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            icon="material-symbols:format-quote"
            title="Quote"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            icon="material-symbols:horizontal-rule"
            title="Horizontal Rule"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            icon="material-symbols:format-clear"
            title="Clear Formatting"
          />

          <ToolbarDivider />

          <ToolbarButton
            onClick={addLink}
            active={editor.isActive("link")}
            icon="material-symbols:link"
            title="Link"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
            icon="material-symbols:link-off"
            title="Unlink"
          />

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon="material-symbols:undo"
            title="Undo"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon="material-symbols:redo"
            title="Redo"
          />
        </div>

        {/* Editor Area */}
        <div
          className="flex-1 overflow-auto custom-scrollbar cursor-text"
          onClick={() => editor.chain().focus().run()}
        >
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
      onClick={onClick}
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
  return <div className="mx-1 h-6 w-px bg-[var(--border-color)]" />;
}
