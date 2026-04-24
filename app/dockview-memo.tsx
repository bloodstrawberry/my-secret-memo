"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps, IDockviewPanelHeaderProps, themeDark, themeLight } from "dockview";
import "dockview/dist/styles/dockview.css";
import MarkdownEditor from "./markdown-editor";


// ── Helper: extract plain text from tiptap JSON ──
function extractTextFromJSON(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  let text = "";
  if (node.text) text += node.text;
  if (node.content) {
    text += node.content.map((child: any) => extractTextFromJSON(child)).join("");
  }
  // Add newline between block-level nodes for proper word separation
  if (node.type && ["paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "hardBreak"].includes(node.type)) {
    text += "\n";
  }
  return text;
}

// ── Context for Multi-Memo Management ──
export const MemoContext = createContext<{
  memos: Record<string, any>;
  titles: Record<string, string>;
  updateMemo: (id: string, val: any, immediate?: boolean) => void;
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
import { memoDB } from "./library/indexDB";
import { useVisualToggleStore } from "./visual-toggle-store";
import { debounce } from "es-toolkit";

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
        onBlur={(val) => updateMemo(props.api.id, val, true)}
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
  const [memos, setMemos] = useState<Record<string, any>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const apiRef = useRef<DockviewReadyEvent["api"] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipPersistRef = useRef(false);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const STORAGE_KEY = "my-secret-key";

  // Use a ref to always have access to the latest state in debounced functions
  const stateRef = useRef({ memos, titles, settings, isDarkMode });
  useEffect(() => {
    stateRef.current = { memos, titles, settings, isDarkMode };
  }, [memos, titles, settings, isDarkMode]);

  // Centralized persistence function
  const persistState = useCallback(async (overrides?: {
    memos?: Record<string, string>;
    titles?: Record<string, string>;
    settings?: EditorSettings;
    isDarkMode?: boolean;
    layout?: any;
  }) => {
    if (!isMounted || skipPersistRef.current) return;

    const layout = overrides?.layout ?? apiRef.current?.toJSON();
    
    // CRITICAL: Do not save if we don't have a layout yet, 
    // otherwise we'll overwrite the DB with empty data.
    if (!layout) return;

    const currentState = {
      memos: overrides?.memos ?? stateRef.current.memos,
      titles: overrides?.titles ?? stateRef.current.titles,
      settings: overrides?.settings ?? stateRef.current.settings,
      theme: (overrides?.isDarkMode ?? stateRef.current.isDarkMode) ? "dark" : "light",
      layout: layout,
      visualToggles: useVisualToggleStore.getState().toolbarVisibility,
    };

    try {
      await memoDB.setItem(STORAGE_KEY, currentState);
      setSaveStatus("success");
      
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (e) {
      setSaveStatus("idle");
      toast.error("데이터 저장에 실패했습니다.");
      console.error("Save failed", e);
    }
  }, [isMounted]);

  // Debounced version for frequent updates (like memo content)
  const debouncedPersist = useRef(
    debounce((overrides?: any) => {
      persistState(overrides);
    }, 1000)
  ).current;

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      const savedData = await memoDB.getItem<any>(STORAGE_KEY);

      if (savedData) {
        if (savedData.memos) setMemos(savedData.memos);
        if (savedData.titles) setTitles(savedData.titles);
        if (savedData.settings) setSettings(savedData.settings);
        if (savedData.theme) {
          const dark = savedData.theme === "dark";
          setIsDarkMode(dark);
          if (dark) document.documentElement.classList.add("dark");
        }
        if (savedData.visualToggles) {
          useVisualToggleStore.setState({ toolbarVisibility: savedData.visualToggles });
        }
        
        // Sync ref immediately so subsequent persistState calls have data
        stateRef.current = {
          memos: savedData.memos || {},
          titles: savedData.titles || {},
          settings: savedData.settings || DEFAULT_SETTINGS,
          isDarkMode: savedData.theme === "dark"
        };
      } else {
        // Fallback to defaults or legacy localStorage
        const legacyMemos = localStorage.getItem(STORAGE_KEYS.MEMOS);
        const legacyTitles = localStorage.getItem(STORAGE_KEYS.TITLES);
        const legacySettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const legacyTheme = localStorage.getItem(STORAGE_KEYS.THEME);

        const initialMemos = legacyMemos ? JSON.parse(legacyMemos) : DEFAULT_MEMOS;
        const initialTitles = legacyTitles ? JSON.parse(legacyTitles) : DEFAULT_TITLES;
        const initialSettings = legacySettings ? JSON.parse(legacySettings) : DEFAULT_SETTINGS;
        const initialIsDark = legacyTheme === "dark";

        setMemos(initialMemos);
        setTitles(initialTitles);
        setSettings(initialSettings);
        setIsDarkMode(initialIsDark);

        stateRef.current = {
          memos: initialMemos,
          titles: initialTitles,
          settings: initialSettings,
          isDarkMode: initialIsDark
        };
      }

      // ONLY set isMounted to true after data is fully loaded and state is updated
      setIsMounted(true);
    };

    loadInitialData();
  }, []);

  // Update Theme DOM
  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode, isMounted]);

  const updateMemo = useCallback((id: string, val: any, immediate = false) => {
    setSaveStatus("saving");
    setMemos(prev => {
      const next = { ...prev, [id]: val };
      if (immediate) {
        persistState({ memos: next });
      } else {
        debouncedPersist({ memos: next });
      }
      return next;
    });
  }, [debouncedPersist, persistState]);

  const updateTitle = useCallback((id: string, title: string) => {
    setSaveStatus("saving");
    setTitles(prev => {
      const next = { ...prev, [id]: title };
      persistState({ titles: next });
      return next;
    });
  }, [persistState]);

  const updateSettings = useCallback((newSettings: Partial<EditorSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      persistState({ settings: next });
      return next;
    });
  }, [persistState]);

  const removeMemo = useCallback((id: string) => {
    setMemos(prev => {
      const next = { ...prev };
      delete next[id];
      // Note: titles will be cleaned up in the setTitles call below
      return next;
    });
    setTitles(prev => {
      const next = { ...prev };
      delete next[id];
      persistState({ titles: next });
      return next;
    });
  }, [persistState]);

  const resetData = useCallback(() => {
    toast.confirm("모든 메모 데이터와 설정을 초기화하시겠습니까?", async () => {
      // Prevent any background saves from re-writing data
      skipPersistRef.current = true;

      await memoDB.deleteItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEYS.MEMOS);
      localStorage.removeItem(STORAGE_KEYS.TITLES);
      localStorage.removeItem(STORAGE_KEYS.LAYOUT);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);

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
    setMemos(prev => ({ ...prev, [id]: { type: "doc", content: [{ type: "paragraph" }] } }));
    setTitles(prev => ({ ...prev, [id]: "New Memo" }));
    persistState();
    toast.success("새로운 메모가 생성되었습니다.");
  }, [persistState]);

  const downloadData = useCallback(async () => {
    const data = await memoDB.getItem(STORAGE_KEY);
    if (!data) {
      toast.error("저장된 데이터가 없습니다.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "next-notepad.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("데이터를 성공적으로 다운로드했습니다.");
  }, []);

  const uploadData = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Prevent background saves from overwriting the uploaded data
        skipPersistRef.current = true;

        // 1. Save to DB first
        await memoDB.setItem(STORAGE_KEY, json);
        
        // 2. Update local state immediately so UI feels responsive
        if (json.memos) setMemos(json.memos);
        if (json.titles) setTitles(json.titles);
        if (json.settings) setSettings(json.settings);
        if (json.theme) {
          const dark = json.theme === "dark";
          setIsDarkMode(dark);
        }
        
        // 3. Update layout if possible
        if (json.layout && apiRef.current) {
          try {
            apiRef.current.fromJSON(json.layout);
          } catch (e) {
            console.error("Layout restore failed during upload", e);
          }
        }

        toast.success("데이터를 성공적으로 업로드했습니다.");
        
        // Short delay to allow state to settle before enabling persistence or reloading
        setTimeout(() => {
          skipPersistRef.current = false;
          // We still reload to ensure everything is perfectly synced and all event listeners are clean
          window.location.reload();
        }, 1000);
      } catch (err) {
        skipPersistRef.current = false;
        toast.error("데이터 업로드에 실패했습니다. 올바른 JSON 파일인지 확인해 주세요.");
      }
    };
    reader.readAsText(file);
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // 1. Listen for layout changes to save
    event.api.onDidLayoutChange(() => {
      persistState();
    });

    // 2. Listen for panel removals to sync state
    event.api.onDidRemovePanel((panel) => {
      removeMemo(panel.id);
    });

    // 3. Load initial panels from saved layout or create defaults
    const initializeLayout = async () => {
      const savedData = await memoDB.getItem<any>(STORAGE_KEY);
      const savedLayout = savedData?.layout;
      const savedTitlesMap = savedData?.titles || {};

      if (savedLayout) {
        try {
          event.api.fromJSON(savedLayout);
          event.api.panels.forEach(panel => {
            if (savedTitlesMap[panel.id]) {
              panel.api.setTitle(savedTitlesMap[panel.id]);
            }
          });
        } catch (e) {
          console.error("Failed to load saved layout", e);
        }
      } else {
        // Legacy fallback
        const legacyLayoutStr = localStorage.getItem(STORAGE_KEYS.LAYOUT);
        if (legacyLayoutStr) {
          try {
            event.api.fromJSON(JSON.parse(legacyLayoutStr));
          } catch (e) {
            console.error("Failed to load legacy layout", e);
          }
        } else {
          // Default Layout
          // Use fromJSON for initial layout setup to avoid race conditions with sequential addPanel calls
          setTimeout(() => {
            try {
              event.api.fromJSON({
                grid: {
                  root: {
                    type: "branch",
                    orientation: "HORIZONTAL",
                    data: [
                      {
                        type: "leaf",
                        size: 50,
                        data: { views: ["memo1"] },
                      },
                      {
                        type: "branch",
                        size: 50,
                        orientation: "VERTICAL",
                        data: [
                          {
                            type: "leaf",
                            size: 50,
                            data: { views: ["memo2"] },
                          },
                          {
                            type: "leaf",
                            size: 50,
                            data: { views: ["memo3"] },
                          },
                        ],
                      },
                    ],
                  },
                },
                panels: {
                  memo1: { id: "memo1", component: "editor", title: savedTitlesMap["memo1"] || DEFAULT_TITLES["memo1"], tabComponent: "default" },
                  memo2: { id: "memo2", component: "editor", title: savedTitlesMap["memo2"] || DEFAULT_TITLES["memo2"], tabComponent: "default" },
                  memo3: { id: "memo3", component: "editor", title: savedTitlesMap["memo3"] || DEFAULT_TITLES["memo3"], tabComponent: "default" },
                },
              } as any);

              // Ensure tab components are set correctly if not included in fromJSON params
              event.api.panels.forEach(panel => {
                // Since fromJSON might not set custom tab components correctly in all versions, 
                // we ensure they are set if needed.
                // Note: dockview 5.x supports tabComponent in fromJSON but just in case.
              });
            } catch (e) {
              console.error("Failed to create default layout via fromJSON", e);
            }
          }, 100);
        }
      }
    };

    initializeLayout();
  }, [removeMemo, persistState]);

  if (!isMounted) return null;

  const totalWords = Object.values(memos).reduce((acc, curr) => {
    const text = extractTextFromJSON(curr).trim();
    return acc + (text ? text.split(/\s+/).length : 0);
  }, 0);
  const totalChars = Object.values(memos).reduce((acc, curr) => {
    return acc + extractTextFromJSON(curr).replace(/\n/g, "").length;
  }, 0);

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
                  NEXT NOTEPAD
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-mono font-medium">PRO</span>

                  <SettingsButton />
                </h1>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium uppercase tracking-widest transition-all duration-300">
                  {saveStatus === "saving" ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                      <span className="text-amber-500/80 font-bold">Saving...</span>
                    </>
                  ) : saveStatus === "success" ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-500 font-bold">Saved Successfully</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-50" />
                      Dockview Mode Active
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={addMemo}
                title="New Memo"
                className="flex items-center justify-center p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <button
                onClick={downloadData}
                title="Download"
                className="flex items-center justify-center p-2.5 rounded-xl bg-[var(--header-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] border border-[var(--border-color)] transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload"
                className="flex items-center justify-center p-2.5 rounded-xl bg-[var(--header-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] border border-[var(--border-color)] transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={uploadData}
                accept=".json"
                className="hidden"
              />

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
