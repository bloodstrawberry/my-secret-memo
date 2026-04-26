import { RefObject } from "react";
import SettingsButton from "@/app/components/settings-button";

interface HeaderProps {
  isEncrypted: boolean;
  toggleEncryption: () => void;
  saveStatus: "idle" | "saving" | "success";
  progressWidth: string;
  addMemo: () => void;
  downloadData: () => void;
  uploadData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export function Header({
  isEncrypted,
  toggleEncryption,
  saveStatus,
  progressWidth,
  addMemo,
  downloadData,
  uploadData,
  fileInputRef,
  isDarkMode,
  setIsDarkMode
}: HeaderProps) {
  return (
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
            <button
              onClick={toggleEncryption}
              title={isEncrypted ? "암호화 해제" : "암호화 잠금"}
              className={`ml-0 p-1.5 rounded-lg transition-all flex items-center justify-center ${isEncrypted
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                }`}
            >
              {isEncrypted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </h1>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium uppercase tracking-widest transition-all duration-300">
            {saveStatus === "saving" ? (
              <>
                <div className="flex items-center gap-1.5 min-w-[80px]">
                  <div className="relative w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-20" />
                    <span className="relative block w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-amber-500/80 font-bold text-[9px] leading-none">SAVING...</span>
                    <div className="w-full h-1 bg-amber-500/10 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all ease-out duration-[2000ms]"
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </div>
                </div>
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
  );
}
