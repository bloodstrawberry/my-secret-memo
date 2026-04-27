import React, { useContext, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { IDockviewPanelProps } from "dockview";
import { MemoContext } from "./context";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import { LockedView } from "./locked-view";
import { DEFAULT_MEMOS } from "@/app/constants/default";

if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args.map(a => String(a)).join(' ');
    if (
      msg.includes("Cannot update a component") &&
      msg.includes("ModalProvider")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function SpreadsheetPanel(props: IDockviewPanelProps) {
  const id = props.api.id;
  useDockviewResize(props.api);
  const { memos, isReadOnly, updateMemo, isEncrypted } = useContext(MemoContext);
  const { toolbarVisibility, lockedTabs } = useVisualToggleStore();
  const showToolbar = toolbarVisibility[id] !== false;
  const isLocked = lockedTabs[id] === true;

  // Track whether changes originated from user edits (not external updates like decrypt)
  const isLocalChangeRef = useRef(false);

  // Remount key: incremented when memo data changes externally (e.g., after decrypt/unlock)
  const [remountKey, setRemountKey] = useState(0);

  // Use a ref to track the last seen raw data to detect external changes
  const lastRawDataRef = useRef<any>(null);

  const getInitialData = useCallback(() => {
    const data = memos[id] || (isEncrypted ? DEFAULT_MEMOS.spreadsheet1 : [{ name: "Sheet1", celldata: [] }]);
    try {
      // Deep clone to prevent FortuneSheet mutations from affecting our state
      // and to ensure we have a fresh reference for the Workbook
      return JSON.parse(JSON.stringify(data));
    } catch (e) {
      return data;
    }
  }, [id, memos, isEncrypted]);

  const initialData = useRef(getInitialData());

  // Detect external data changes (decrypt, upload, etc.) and reinitialize Workbook
  const lastEncryptedRef = useRef(isEncrypted);

  useEffect(() => {
    // If the change originated from this component's local edits, 
    // we don't want to remount as that would reset scroll/selection.
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      lastRawDataRef.current = memos[id];
      lastEncryptedRef.current = isEncrypted;
      return;
    }

    // Check if the data or encryption state has actually changed externally
    const currentRawData = memos[id];
    if (currentRawData !== lastRawDataRef.current || isEncrypted !== lastEncryptedRef.current) {
      lastRawDataRef.current = currentRawData;
      lastEncryptedRef.current = isEncrypted;
      initialData.current = getInitialData();
      setRemountKey(prev => prev + 1);
    }
  }, [id, memos[id], isEncrypted, getInitialData]);

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
      // Push the state update to the next tick to avoid "Cannot update a component while rendering a different component"
      setTimeout(() => {
        updateMemo(id, cloned);
      }, 0);
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
        "freeze", "quick-formula",
      ]
    };
  }, [handleChange, showToolbar, isReadOnly, remountKey]);

  return (
    <div
      className="w-full h-full relative light"
      style={{ background: 'white' }}
    >
      {(isLocked && !isEncrypted) ? (
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
          <div
            key={remountKey}
            className={isReadOnly ? "pt-7 w-full h-full" : "w-full h-full"}
            ref={(el) => {
              if (el) {
                // Trigger a resize when the element itself is mounted or changed
                window.dispatchEvent(new Event('resize'));
              }
            }}
          >
            <Workbook {...settings} />
          </div>
        </>
      )}
    </div>
  );
}

// Separate hook to handle Dockview events
function useDockviewResize(api: any) {
  useEffect(() => {
    const handleResize = () => {
      // Use requestAnimationFrame or setTimeout to ensure Dockview has finished its layout
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    };

    const d1 = api.onDidDimensionsChange(handleResize);
    const d2 = api.onDidVisibilityChange((e: { isVisible: boolean }) => {
      if (e.isVisible) handleResize();
    });

    // Initial trigger
    handleResize();

    return () => {
      d1.dispose();
      d2.dispose();
    };
  }, [api]);
}
