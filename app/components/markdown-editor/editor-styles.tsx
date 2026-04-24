import { EditorSettings } from "../../settings-context";

interface EditorStylesProps {
  settings: EditorSettings;
}

export function EditorStyles({ settings }: EditorStylesProps) {
  return (
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
  );
}
