import React, { useContext, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import { MemoContext } from "./context";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { LockedView } from "./locked-view";

export function SpreadsheetPanel(props: IDockviewPanelProps) {
  const id = props.api.id;
  const { memos, isReadOnly, updateMemo } = useContext(MemoContext);
  const { toolbarVisibility, lockedTabs } = useVisualToggleStore();
  const showToolbar = toolbarVisibility[id] !== false;
  const isLocked = lockedTabs[id] === true;

  // Track whether changes originated from user edits (not external updates like decrypt)
  const isLocalChangeRef = useRef(false);

  // Remount key: incremented when memo data changes externally (e.g., after decrypt/unlock)
  // This forces the Workbook to reinitialize with fresh data.
  const [remountKey, setRemountKey] = useState(0);
  const initialData = useRef(memos[id] || [{ name: "Sheet1", celldata: [] }]);

  // Detect external data changes (decrypt, upload, etc.) and reinitialize Workbook
  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    const currentData = memos[id];
    if (currentData && currentData !== initialData.current) {
      initialData.current = currentData;
      setRemountKey(prev => prev + 1);
    }
  }, [memos[id]]);

  const handleChange = useCallback((newData: any) => {
    // Block writes in read-only mode
    if (isReadOnly) return;

    // FortuneSheet mutates the 2D 'data' matrix but does NOT update 'celldata'.
    // We must rebuild 'celldata' from 'data' to save the changes.
    // Also, we remove 'data' to prevent saving massive arrays with nulls to IndexedDB.
    const safeData = newData.map((sheet: any) => {
      const { data, ...rest } = sheet;
      
      if (data && Array.isArray(data)) {
        const newCelldata: any[] = [];
        for (let r = 0; r < data.length; r++) {
          if (Array.isArray(data[r])) {
            for (let c = 0; c < data[r].length; c++) {
              if (data[r][c] !== null && data[r][c] !== undefined) {
                newCelldata.push({ r, c, v: data[r][c] });
              }
            }
          }
        }
        rest.celldata = newCelldata;
      }
      return rest;
    });

    try {
      const cloned = JSON.parse(JSON.stringify(safeData));
      isLocalChangeRef.current = true;
      updateMemo(id, cloned);
    } catch (e) {
      console.error("Failed to stringify spreadsheet data:", e);
    }
  }, [id, isReadOnly, updateMemo]);

  const settings = useMemo(() => {
    return {
      data: initialData.current,
      onChange: handleChange,
      onOp: (ops: any) => console.log("FortuneSheet onOp:", ops),
      lang: 'en',
      showToolbar: showToolbar && !isReadOnly,
      showFormulaBar: showToolbar && !isReadOnly,
      showSheetTabs: true,
      allowEdit: !isReadOnly,
      toolbarItems: [
        "undo", "redo", "format-painter", "clear-format", "|", 
        "currency-format", "percentage-format", "number-decrease", "number-increase", 
        "format", "font-size", "|", 
        "bold", "italic", "strike-through", "underline", "|", 
        "font-color", "background", "border", "merge-cell", "|", 
        "horizontal-align", "vertical-align", "text-wrap", "text-rotation", "|", 
        "freeze", "sort", "image", "comment", "quick-formula",
      ]
    };
  }, [handleChange, showToolbar, isReadOnly, remountKey]);

  return (
    <div 
      className="w-full h-full relative light" 
      style={{ background: 'white' }}
    >
      {isLocked ? (
        <LockedView panelId={id} />
      ) : (
        <>
          {/* Read-only indicator */}
          {isReadOnly && (
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              읽기 전용
            </div>
          )}
          <div key={remountKey} className={isReadOnly ? "pt-7 w-full h-full" : "w-full h-full"}>
            <Workbook {...settings} />
          </div>
        </>
      )}
    </div>
  );
}
