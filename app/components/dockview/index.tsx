"use client";

import { useRef, useMemo } from "react";
import { DockviewReact, DockviewReadyEvent, themeDark, themeLight } from "dockview";
import "dockview/dist/styles/dockview.css";
import { SettingsContext } from "@/app/context/settings-context";
import { RightControls } from "@/app/components/controls";
import { MemoContext } from "./context";
import { CustomTab } from "./custom-tab";
import { EditorPanel } from "./editor-panel";
import { Header } from "./header";
import { Footer } from "./footer";
import { useMemoLogic } from "./use-memo-logic";
import { useDockviewManager } from "./use-dockview-manager";
import { extractTextFromJSON } from "./utils";
import LoadingOverlay from "@/app/components/loading-overlay";

import { SpreadsheetPanel } from "./spreadsheet-panel";
import { TodoListPanel } from "./to-do-list";

const COMPONENTS = {
  editor: EditorPanel,
  todoList: TodoListPanel,
  spreadsheet: SpreadsheetPanel,
};

const TAB_COMPONENTS = {
  default: CustomTab,
};

export default function DockviewMemo() {
  const apiRef = useRef<DockviewReadyEvent["api"] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    memos, titles, isDarkMode, setIsDarkMode, isMounted, settings, updateSettings,
    saveStatus, progressWidth, isEncrypted, isReadOnly, lastUpdated, persistState, removeMemo, resetData,
    updateMemo, updateTitle, addMemo, downloadData, uploadData, toggleEncryption, loadHistoryDate, deleteHistoryDate
  } = useMemoLogic(apiRef);

  const { onReady, panelIds } = useDockviewManager(apiRef, removeMemo, persistState);

  const visibleMemos = useMemo(() => {
    return panelIds.map(id => memos[id]).filter(Boolean);
  }, [panelIds, memos]);

  const totalWords = useMemo(() => visibleMemos.reduce((acc, curr) => {
    const text = extractTextFromJSON(curr).trim();
    return acc + (text ? text.split(/\s+/).length : 0);
  }, 0), [visibleMemos]);

  const totalChars = useMemo(() => visibleMemos.reduce((acc, curr) => {
    return acc + extractTextFromJSON(curr).replace(/\n/g, "").length;
  }, 0), [visibleMemos]);

  if (!isMounted) return null;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <MemoContext.Provider value={{ memos, titles, isEncrypted, isReadOnly, updateMemo, updateTitle, removeMemo, resetData }}>
        <main className="h-screen w-screen bg-[var(--background)] overflow-hidden flex flex-col font-sans relative transition-colors duration-300">
          {/* Background blobs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-20 transition-opacity duration-500">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500 rounded-full blur-[120px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
          </div>

          <Header
            isEncrypted={isEncrypted}
            toggleEncryption={toggleEncryption}
            saveStatus={saveStatus}
            progressWidth={progressWidth}
            addMemo={addMemo}
            downloadData={downloadData}
            uploadData={uploadData}
            fileInputRef={fileInputRef}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            loadHistoryDate={loadHistoryDate}
            deleteHistoryDate={deleteHistoryDate}
          />

          {/* Dockview */}
          <div className="flex-1 relative min-h-0 bg-[var(--background)] transition-colors duration-300">
            <DockviewReact
              components={COMPONENTS}
              tabComponents={TAB_COMPONENTS}
              onReady={onReady}
              theme={isDarkMode ? themeDark : themeLight}
              className="dockview-theme-memo"
              rightHeaderActionsComponent={RightControls}
            />
            <LoadingOverlay />
          </div>

          <Footer
            totalWords={totalWords}
            totalChars={totalChars}
            memoCount={panelIds.length}
            lastUpdated={lastUpdated}
          />
        </main>
      </MemoContext.Provider>
    </SettingsContext.Provider>
  );
}
