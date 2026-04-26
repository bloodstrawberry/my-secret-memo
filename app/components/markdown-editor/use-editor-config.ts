import { useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
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
import { Markdown } from "tiptap-markdown";
import { debounce } from "es-toolkit";
import { EditorJSON, MarkdownEditorProps, EDITOR_PADDING } from "./types";
import { useSettings } from "@/app/context/settings-context";

export function useEditorConfig({ value, onChange, onBlur, placeholder }: MarkdownEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { settings } = useSettings();

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

  return {
    editor,
    isMounted,
    settings,
  };
}
