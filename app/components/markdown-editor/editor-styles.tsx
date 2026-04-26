import { EditorSettings } from "@/app/context/settings-context";

interface EditorStylesProps {
  settings: EditorSettings;
}

export function EditorStyles({ settings }: EditorStylesProps) {
  // Clamp line-height to a minimum of 1.0 to prevent text overlap on word wrap
  const safeLineHeight = Math.max(1.0, parseFloat(settings.lineHeight) || 1.6);
  const isJeonSoMin = settings.fontFamily.includes("JeonSoMin");
  const baseFontSize = parseInt(settings.fontSize) || 16;
  const adjustedFontSize = isJeonSoMin ? `${baseFontSize + 2}px` : settings.fontSize;

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      .tiptap.prose {
        font-family: ${settings.fontFamily} !important;
        font-size: ${adjustedFontSize} !important;
        line-height: ${safeLineHeight} !important;
        letter-spacing: ${settings.letterSpacing} !important;
        max-width: ${settings.maxWidth} !important;
        transition: none !important;
      }
      /* Ensure all children inherit the font-family and line-height */
      .tiptap.prose * {
        font-family: inherit !important;
        line-height: inherit !important;
      }
      .tiptap.prose hr {
        margin: 2em 0 !important;
        border: 0 !important;
        border-top: 1px solid var(--hr-color, #000000) !important;
        opacity: 1 !important;
      }
      /* Specific overrides for common prose elements */
      .tiptap.prose p {
        font-family: inherit !important;
        line-height: inherit !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }
      .tiptap.prose h1, .tiptap.prose h2, .tiptap.prose h3 {
        font-family: inherit !important;
        line-height: inherit !important;
      }
      .tiptap.prose li {
        font-family: inherit !important;
        line-height: inherit !important;
      }
    ` }} />
  );
}
