import { useContext, memo } from "react";
import { IDockviewPanelProps } from "dockview";
import MarkdownEditor from "../../markdown-editor";
import { MemoContext } from "./context";

export const EditorPanel = memo(function EditorPanel(props: IDockviewPanelProps) {
  const { memos, updateMemo } = useContext(MemoContext);
  const memo = memos[props.api.id] || "";

  return (
    <div className="h-full w-full bg-[var(--panel-bg)] p-0 flex flex-col overflow-hidden transition-colors duration-300 border border-[var(--border-color)]">
      <MarkdownEditor
        value={memo}
        onChange={(val) => updateMemo(props.api.id, val)}
        onBlur={(val) => updateMemo(props.api.id, val, true)}
        placeholder="메모 내용을 입력하세요..."
        panelId={props.api.id}
      />
    </div>
  );
});
