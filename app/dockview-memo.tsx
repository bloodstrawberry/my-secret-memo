"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps, themeDark, themeLight } from "dockview";
import "dockview/dist/styles/dockview.css";
import MarkdownEditor from "./markdown-editor";

// ── Context for Multi-Memo Management ──
const MemoContext = createContext<{
  memos: Record<string, string>;
  updateMemo: (id: string, val: string) => void;
}>({ memos: {}, updateMemo: () => {} });

// ── Panel Components ──
function EditorPanel(props: IDockviewPanelProps) {
  const { memos, updateMemo } = useContext(MemoContext);
  const memo = memos[props.api.id] || "";

  return (
    <div className="h-full w-full bg-[var(--panel-bg)] p-0 flex flex-col overflow-hidden transition-colors duration-300">
      <MarkdownEditor
        value={memo}
        onChange={(val) => updateMemo(props.api.id, val)}
        placeholder="메모 내용을 입력하세요..."
      />
    </div>
  );
}

const COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelProps>> = {
  editor: EditorPanel,
};

// ── Main Component ──
export default function DockviewMemo() {
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const apiRef = useRef<DockviewReadyEvent["api"] | null>(null);

  // Initial load
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
    
    const savedMemos = localStorage.getItem("my-secret-memos-v2");
    if (savedMemos) {
      try {
        setMemos(JSON.parse(savedMemos));
      } catch (e) {
        console.error("Failed to parse saved memos", e);
      }
    }
  }, []);

  // Update Theme
  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode, isMounted]);

  // Auto-save
  useEffect(() => {
    if (isMounted && Object.keys(memos).length > 0) {
      localStorage.setItem("my-secret-memos-v2", JSON.stringify(memos));
    }
  }, [memos, isMounted]);

  const updateMemo = useCallback((id: string, val: string) => {
    setMemos(prev => ({ ...prev, [id]: val }));
  }, []);

  const addMemo = useCallback(() => {
    if (!apiRef.current) return;
    const id = `memo-${Date.now()}`;
    apiRef.current.addPanel({
      id: id,
      component: "editor",
      title: `New Memo`,
    });
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // Load initial panels from saved memos or create a default one
    const savedMemos = localStorage.getItem("my-secret-memos-v2");
    if (savedMemos) {
      const parsed = JSON.parse(savedMemos);
      Object.keys(parsed).forEach((id, index) => {
        event.api.addPanel({
          id: id,
          component: "editor",
          title: `Memo ${index + 1}`,
        });
      });
    } else {
      event.api.addPanel({
        id: "default-memo",
        component: "editor",
        title: "Welcome Memo",
      });
    }
  }, []);

  if (!isMounted) return null;

  const totalWords = Object.values(memos).reduce((acc, curr) => acc + (curr ? curr.trim().split(/\s+/).length : 0), 0);
  const totalChars = Object.values(memos).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <MemoContext.Provider value={{ memos, updateMemo }}>
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
            onReady={onReady}
            theme={isDarkMode ? themeDark : themeLight}
            className="dockview-theme-memo"
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
  );
}
