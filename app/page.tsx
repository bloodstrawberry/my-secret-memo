"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MemoPage() {
  const [memo, setMemo] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  // Load memo from localStorage on mount
  useEffect(() => {
    const savedMemo = localStorage.getItem("my-secret-memo");
    if (savedMemo) {
      setMemo(savedMemo);
    }
    setIsMounted(true);
  }, []);

  // Save memo to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("my-secret-memo", memo);
    }
  }, [memo, isMounted]);

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-6 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Personal Memo
            </h1>
            <p className="text-slate-400 text-sm mt-1">Markdown supported Notepad</p>
          </div>
          <div className="text-xs text-slate-500">Auto-saving...</div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-160px)]">
          {/* Editor Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
              Editor
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Start typing your thoughts in Markdown..."
              className="flex-1 w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-sm transition-all text-slate-200 placeholder:text-slate-600 font-mono leading-relaxed"
            />
          </div>

          {/* Preview Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
              Preview
            </label>
            <div className="flex-1 bg-slate-900/30 border border-slate-700/50 rounded-xl p-6 overflow-auto backdrop-blur-md">
              <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-bold prose-a:text-cyan-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {memo || "*Preview will appear here...*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex justify-start gap-4">
          <button
            onClick={() => setMemo("")}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        </footer>
      </div>
    </main>
  );
}
