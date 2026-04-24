"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps, IDockviewPanelHeaderProps, themeDark, themeLight } from "dockview";
import "dockview/dist/styles/dockview.css";
import MarkdownEditor from "./markdown-editor";

// ── Context for Multi-Memo Management ──
export const MemoContext = createContext<{
  memos: Record<string, string>;
  titles: Record<string, string>;
  updateMemo: (id: string, val: string) => void;
  updateTitle: (id: string, title: string) => void;
  removeMemo: (id: string) => void;
  resetData: () => void;
}>({
  memos: {},
  titles: {},
  updateMemo: () => { },
  updateTitle: () => { },
  removeMemo: () => { },
  resetData: () => { }
});

export const useMemoStore = () => useContext(MemoContext);

import { SettingsContext, useSettings, DEFAULT_SETTINGS, type EditorSettings } from "./settings-context";
import SettingsButton from "./settings-button";
import { RightControls } from "./controls";
import { toast } from "./toast";
import { DEFAULT_MEMOS, DEFAULT_TITLES, STORAGE_KEYS } from "./default";

// ── Custom Tab Component ──
function CustomTab(props: IDockviewPanelHeaderProps) {
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
        <span className="invisible text-[10px] font-bold tracking-widest uppercase whitespace-pre px-0.5">
          {tempTitle || " "}
        </span>

        {isEditing ? (
          <input
            autoFocus
            className="absolute inset-y-0 left-0 bg-transparent text-[10px] font-bold tracking-widest uppercase outline-none border-none text-[var(--foreground)] p-0 m-0 w-full leading-none"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={onKeyDown}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="absolute inset-y-0 left-0 truncate w-full text-[10px] font-bold tracking-widest uppercase text-[var(--foreground)] opacity-70 group-hover:opacity-100 transition-opacity flex items-center">
            {props.api.title}
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          props.api.close();
        }}
        className="p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-all shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Panel Components ──
function EditorPanel(props: IDockviewPanelProps) {
  const { memos, updateMemo } = useContext(MemoContext);
  const memo = memos[props.api.id] || "";

  return (
    <div className="h-full w-full bg-[var(--panel-bg)] p-0 flex flex-col overflow-hidden transition-colors duration-300 border border-[var(--border-color)]">
      <MarkdownEditor
        value={memo}
        onChange={(val) => updateMemo(props.api.id, val)}
        placeholder="메모 내용을 입력하세요..."
        panelId={props.api.id}
      />
    </div>
  );
}

const COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelProps>> = {
  editor: EditorPanel,
};

const TAB_COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelHeaderProps>> = {
  default: CustomTab,
};


// ── Main Component ──
export default function DockviewMemo() {
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const apiRef = useRef<DockviewReadyEvent["api"] | null>(null);

  // Initial load
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }

    const savedMemos = localStorage.getItem(STORAGE_KEYS.MEMOS);
    if (savedMemos) {
      try {
        setMemos(JSON.parse(savedMemos));
      } catch (e) {
        console.error("Failed to parse saved memos", e);
        setMemos(DEFAULT_MEMOS);
      }
    } else {
      setMemos(DEFAULT_MEMOS);
    }

    const savedTitles = localStorage.getItem(STORAGE_KEYS.TITLES);
    if (savedTitles) {
      try {
        setTitles(JSON.parse(savedTitles));
      } catch (e) {
        console.error("Failed to parse saved titles", e);
        setTitles(DEFAULT_TITLES);
      }
    } else {
      setTitles(DEFAULT_TITLES);
    }
  }, []);

  // Update Theme
  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEYS.THEME, "light");
    }
  }, [isDarkMode, isMounted]);

  // Auto-save
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEYS.MEMOS, JSON.stringify(memos));
    }
  }, [memos, isMounted]);

  const updateMemo = useCallback((id: string, val: string) => {
    setMemos(prev => ({ ...prev, [id]: val }));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setTitles(prev => {
      const next = { ...prev, [id]: title };
      localStorage.setItem(STORAGE_KEYS.TITLES, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<EditorSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeMemo = useCallback((id: string) => {
    setMemos(prev => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEYS.MEMOS, JSON.stringify(next));
      return next;
    });
    setTitles(prev => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEYS.TITLES, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    toast.confirm("모든 메모 데이터와 설정을 초기화하시겠습니까?", () => {
      localStorage.removeItem(STORAGE_KEYS.MEMOS);
      localStorage.removeItem(STORAGE_KEYS.TITLES);
      localStorage.removeItem(STORAGE_KEYS.LAYOUT);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      
      setMemos(DEFAULT_MEMOS);
      setTitles(DEFAULT_TITLES);
      setSettings(DEFAULT_SETTINGS);
      
      // Full reload to ensure Dockview resets its layout to default
      window.location.reload();
    });
  }, []);

  const addMemo = useCallback(() => {
    if (!apiRef.current) return;
    const id = `memo-${Date.now()}`;
    apiRef.current.addPanel({
      id: id,
      component: "editor",
      title: `New Memo`,
      tabComponent: "default",
    });
    toast.success("새로운 메모가 생성되었습니다.");
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // 1. Listen for layout changes to save
    event.api.onDidLayoutChange(() => {
      const layout = event.api.toJSON();
      localStorage.setItem(STORAGE_KEYS.LAYOUT, JSON.stringify(layout));
    });

    // 2. Listen for panel removals to sync state
    event.api.onDidRemovePanel((panel) => {
      removeMemo(panel.id);
    });

    // 3. Load initial panels from saved layout or create defaults
    const savedLayoutStr = localStorage.getItem(STORAGE_KEYS.LAYOUT);
    const savedMemosStr = localStorage.getItem(STORAGE_KEYS.MEMOS);
    const savedTitlesStr = localStorage.getItem(STORAGE_KEYS.TITLES);

    let savedTitlesMap: Record<string, string> = {};
    try {
      if (savedTitlesStr) savedTitlesMap = JSON.parse(savedTitlesStr);
    } catch (e) {
      console.error("Failed to parse saved titles in onReady", e);
    }

    if (savedLayoutStr) {
      try {
        const layout = JSON.parse(savedLayoutStr);
        event.api.fromJSON(layout);

        // Ensure titles are synced after loading layout
        event.api.panels.forEach(panel => {
          if (savedTitlesMap[panel.id]) {
            panel.api.setTitle(savedTitlesMap[panel.id]);
          }
        });
      } catch (e) {
        console.error("Failed to parse saved layout", e);
      }
    } else {
      // Default Layout: MEMO1 (Left) | MEMO2 (Top Right)
      //                              | MEMO3 (Bottom Right)
      const memo1 = event.api.addPanel({
        id: "memo1",
        component: "editor",
        title: savedTitlesMap["memo1"] || DEFAULT_TITLES["memo1"],
        tabComponent: "default",
      });

      const memo2 = event.api.addPanel({
        id: "memo2",
        component: "editor",
        title: savedTitlesMap["memo2"] || DEFAULT_TITLES["memo2"],
        position: { referencePanel: memo1, direction: "right" },
        tabComponent: "default",
      });

      event.api.addPanel({
        id: "memo3",
        component: "editor",
        title: savedTitlesMap["memo3"] || DEFAULT_TITLES["memo3"],
        position: { referencePanel: memo2, direction: "below" },
        tabComponent: "default",
      });
    }
  }, [removeMemo]);

  if (!isMounted) return null;

  const totalWords = Object.values(memos).reduce((acc, curr) => acc + (curr ? curr.trim().split(/\s+/).length : 0), 0);
  const totalChars = Object.values(memos).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <MemoContext.Provider value={{ memos, titles, updateMemo, updateTitle, removeMemo, resetData }}>
        <main className="h-screen w-screen bg-[var(--background)] overflow-hidden flex flex-col font-sans relative transition-colors duration-300">
          {/* Background blobs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-20 transition-opacity duration-500">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500 rounded-full blur-[120px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
          </div>

          {/* Header */}
          <header className="px-6 py-4 flex justify-between items-center bg-[var(--header-bg)] border-b border-[var(--border-color)] backdrop-blur-xl z-10 shrink-0 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-2">
                  MEMO ORGANIZER
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-mono font-medium">PRO</span>

                  <SettingsButton />
                </h1>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Dockview Mode Active
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={addMemo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Memo
              </button>

              <div className="h-8 w-[1px] bg-[var(--border-color)]"></div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl bg-[var(--border-color)] hover:scale-110 transition-all duration-300"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 11-2 0V3a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </header>

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
          </div>

          {/* Footer */}
          <footer className="px-6 py-2 bg-[var(--footer-bg)] border-t border-[var(--border-color)] flex justify-between items-center z-10 shrink-0 transition-all duration-300">
            <div className="flex gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <span>Total Words: {totalWords}</span>
              <span>Total Chars: {totalChars}</span>
              <span>Memos: {Object.keys(memos).length}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Organized with Dockview
            </div>
          </footer>
        </main>
      </MemoContext.Provider>
    </SettingsContext.Provider>
  );
}
