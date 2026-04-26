import { useState, useEffect, useContext, memo } from "react";
import { IDockviewPanelHeaderProps } from "dockview";
import { MemoContext } from "./context";
import { toast } from "@/app/components/toast";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";

export const CustomTab = memo(function CustomTab(props: IDockviewPanelHeaderProps) {
  const { updateTitle } = useContext(MemoContext);
  const { lockedTabs } = useVisualToggleStore();
  const isLocked = lockedTabs[props.api.id] === true;
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(props.api.title || "");

  // Sync tempTitle with props.api.title when it changes externally
  useEffect(() => {
    setTempTitle(props.api.title || "");
  }, [props.api.title]);

  const saveTitle = () => {
    setIsEditing(false);
    const trimmed = (tempTitle || "").trim();
    if (trimmed && trimmed !== props.api.title) {
      props.api.setTitle(trimmed);
      updateTitle(props.api.id, trimmed);
    } else {
      setTempTitle(props.api.title || "");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveTitle();
    if (e.key === "Escape") {
      setIsEditing(false);
      setTempTitle(props.api.title || "");
    }
  };

  return (
    <div
      className="flex items-center h-full px-3 gap-2 min-w-0 select-none cursor-pointer group"
      onDoubleClick={() => setIsEditing(true)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative flex items-center min-w-[20px] max-w-[150px]">
        {/* Ghost element to drive the width dynamically */}
        <span className="invisible font-bold tracking-widest whitespace-pre px-0.5" style={{ fontSize: 'var(--dv-tab-font-size)' }}>
          {tempTitle || " "}
        </span>

        {isEditing ? (
          <input
            autoFocus
            className="absolute inset-y-0 left-0 bg-transparent font-bold tracking-widest outline-none border-none text-[var(--foreground)] p-0 m-0 w-full leading-none"
            style={{ fontSize: 'var(--dv-tab-font-size)' }}
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={onKeyDown}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="absolute inset-y-0 left-0 truncate w-full font-bold tracking-widest text-[var(--foreground)] opacity-70 group-hover:opacity-100 transition-opacity flex items-center" style={{ fontSize: 'var(--dv-tab-font-size)' }}>
            {props.api.title}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isLocked) {
            toast.error("잠겨있는 탭은 삭제할 수 없습니다. 먼저 잠금을 해제해 주세요.");
            return;
          }
          const isTodo = props.api.id.startsWith("todo");
          const message = isTodo 
            ? "탭을 종료하면 To-Do List가 삭제됩니다. 정말 삭제하시겠습니까?"
            : "탭을 종료하면 메모가 삭제됩니다. 정말 삭제하시겠습니까?";
            
          toast.confirm(message, () => {
            props.api.close();
          }, { type: "danger", confirmText: "삭제", cancelText: "유지" });
        }}
        className="p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-all shrink-0 opacity-0 group-hover:opacity-100"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});
