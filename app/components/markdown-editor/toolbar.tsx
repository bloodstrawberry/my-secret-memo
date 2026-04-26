import { Editor } from "@tiptap/react";
import { RefObject } from "react";
import { ToolbarButton, ToolbarDivider } from "./toolbar-button";
import { toast } from "@/app/components/toast";

interface ToolbarProps {
  editor: Editor;
  colorInputRef: RefObject<HTMLInputElement | null>;
  highlightInputRef: RefObject<HTMLInputElement | null>;
}

export function Toolbar({ editor, colorInputRef, highlightInputRef }: ToolbarProps) {
  const addLink = () => {
    toast.prompt("URL을 입력하세요", (url) => {
      if (url) {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }
    }, { placeholder: "https://..." });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-sm sticky top-0 z-10">
      {/* Headings Dropdown */}
      <div className="flex items-center gap-1">
        <select
          className="bg-[var(--panel-bg)] text-[var(--foreground)] text-xs font-medium px-2 py-1 rounded-md border border-[var(--border-color)] outline-none hover:bg-slate-500/5 focus:ring-1 focus:ring-cyan-500/30 cursor-pointer transition-all duration-200"
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
  );
}
