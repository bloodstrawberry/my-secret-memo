import React, { useContext, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import { MemoContext } from "./context";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";

export function SpreadsheetPanel(props: IDockviewPanelProps) {
  const id = props.api.id;
  const { memos, isReadOnly, updateMemo } = useContext(MemoContext);
  const initialData = useRef(memos[id] || [{ name: "Sheet1", celldata: [] }]);
  const { toolbarVisibility } = useVisualToggleStore();
  const showToolbar = toolbarVisibility[id] !== false;

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
  }, [handleChange, showToolbar, isReadOnly]);

  return (
    <div className="w-full h-full relative" style={{ background: 'white' }}>
      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          읽기 전용
        </div>
      )}
      <div className={isReadOnly ? "pt-7 w-full h-full" : "w-full h-full"}>
        <Workbook {...settings} />
      </div>
    </div>
  );
}
