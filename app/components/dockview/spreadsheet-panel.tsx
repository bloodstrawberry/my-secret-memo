import React, { useContext, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import { MemoContext } from "./context";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";

export function SpreadsheetPanel(props: IDockviewPanelProps) {
  const id = props.api.id;
  const { memos, updateMemo } = useContext(MemoContext);
  const initialData = useRef(memos[id] || [{ name: "Sheet1", celldata: [] }]);
  const { toolbarVisibility } = useVisualToggleStore();
  const showToolbar = toolbarVisibility;

  const handleChange = useCallback((newData: any) => {
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
  }, [id, updateMemo]);

  const settings = useMemo(() => {
    return {
      data: initialData.current,
      onChange: handleChange,
      onOp: (ops: any) => console.log("FortuneSheet onOp:", ops),
      lang: 'en',
      showToolbar: showToolbar,
      showFormulaBar: showToolbar,
      showSheetTabs: true,
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
  }, [handleChange, showToolbar]);

  return (
    <div className="w-full h-full relative" style={{ background: 'white' }}>
      <Workbook {...settings} />
    </div>
  );
}
