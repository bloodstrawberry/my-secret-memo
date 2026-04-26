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

  // Store callbacks in refs to avoid stale closures in useEditor/debounce
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  // Flag: true while the editor itself is the source of changes (prevents sync loop)
  const isLocalChangeRef = useRef(false);

  // Debounced version of onChange to avoid constant parent re-renders
  const debouncedOnChange = useRef(
    debounce((val: EditorJSON) => {
      isLocalChangeRef.current = true;
      onChangeRef.current(val);
    }, 400)
  ).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  const lastEmitTimeRef = useRef<number>(Date.now());

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
        lastEmitTimeRef.current = now;
        isLocalChangeRef.current = true;
        onChangeRef.current(json);
      } else {
        debouncedOnChange(json);
      }
    },
    onBlur: ({ editor }) => {
      const json = editor.getJSON();
      debouncedOnChange.cancel();
      isLocalChangeRef.current = true;
      onBlurRef.current?.(json);
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none min-h-full ${EDITOR_PADDING} text-[var(--foreground)] mx-auto`,
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes ONLY — never re-apply our own edits back
  useEffect(() => {
    if (!editor || !isMounted || value === undefined) return;

    // If this value change was triggered by our own onUpdate/onBlur, skip it entirely
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }

    // Never interrupt the user while they are actively typing or composing (IME)
    if (editor.isFocused || editor.view.composing) {
      return;
    }

    // This is a genuine external change (e.g. file upload, decrypt, reset) — apply it
    const incomingJSON = typeof value === "string" ? value : JSON.stringify(value);
    const currentJSON = JSON.stringify(editor.getJSON());

    if (incomingJSON !== currentJSON) {
      editor.commands.setContent(value);
    }
  }, [value, editor, isMounted]);

  // Sync settings changes
  useEffect(() => {
    if (editor && settings) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose dark:prose-invert max-w-none focus:outline-none min-h-full ${EDITOR_PADDING} text-[var(--foreground)] mx-auto`,
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
