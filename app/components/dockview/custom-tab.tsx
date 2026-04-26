import { useState, useEffect, useContext, memo } from "react";
import { IDockviewPanelHeaderProps } from "dockview";
import { MemoContext } from "./context";
import { toast } from "@/app/components/toast";

export const CustomTab = memo(function CustomTab(props: IDockviewPanelHeaderProps) {
  const { updateTitle } = useContext(MemoContext);
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
    >
      <div className="relative flex items-center min-w-[20px] max-w-[150px]">
        {/* Ghost element to drive the width dynamically */}
        <span className="invisible font-bold tracking-widest uppercase whitespace-pre px-0.5" style={{ fontSize: 'var(--dv-tab-font-size)' }}>
          {tempTitle || " "}
        </span>

        {isEditing ? (
          <input
            autoFocus
            className="absolute inset-y-0 left-0 bg-transparent font-bold tracking-widest uppercase outline-none border-none text-[var(--foreground)] p-0 m-0 w-full leading-none"
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
          <span className="absolute inset-y-0 left-0 truncate w-full font-bold tracking-widest uppercase text-[var(--foreground)] opacity-70 group-hover:opacity-100 transition-opacity flex items-center" style={{ fontSize: 'var(--dv-tab-font-size)' }}>
            {props.api.title}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.confirm("탭을 종료하면 메모가 삭제됩니다. 종료하시겠습니까?", () => {
            props.api.close();
          });
        }}
        className="p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-all shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});
