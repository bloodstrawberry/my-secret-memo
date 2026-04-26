import { useContext, memo } from "react";
import { IDockviewPanelProps } from "dockview";
import MarkdownEditor from "@/app/components/markdown-editor";
import { MemoContext } from "./context";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { LockedView } from "./locked-view";

export const EditorPanel = memo(function EditorPanel(props: IDockviewPanelProps) {
  const { memos, isReadOnly, updateMemo } = useContext(MemoContext);
  const memo = memos[props.api.id] || "";
  const { lockedTabs } = useVisualToggleStore();
  const isLocked = lockedTabs[props.api.id] === true;

  return (
    <div className="h-full w-full bg-[var(--panel-bg)] p-0 flex flex-col overflow-hidden transition-colors duration-300 border border-[var(--border-color)] relative">
      {isLocked ? (
        <LockedView panelId={props.api.id} />
      ) : (
        <MarkdownEditor
          value={memo}
          onChange={(val: any) => updateMemo(props.api.id, val)}
          onBlur={(val: any) => updateMemo(props.api.id, val, true)}
          placeholder="메모 내용을 입력하세요..."
          panelId={props.api.id}
          readOnly={isReadOnly}
        />
      )}
    </div>
  );
});
