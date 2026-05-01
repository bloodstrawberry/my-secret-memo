import { RefObject, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SettingsButton from "@/app/components/settings-button";
import ManualModal from "@/app/components/manual-modal";
import { useAutoLockStore } from "@/app/store/auto-lock-store";
import { useHistoryStore } from "@/app/store/history-store";
import { HistoryCalendar } from "./history-calendar";
import { Icon } from "@iconify/react";
import Tooltip from "@mui/material/Tooltip";

interface HeaderProps {
  isEncrypted: boolean;
  toggleEncryption: () => void;
  saveStatus: "idle" | "saving" | "success";
  progressWidth: string;
  addMemo: (type?: "memo" | "todo" | "spreadsheet") => void;
  downloadData: (mode: "current" | "full") => void;
  uploadData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  loadHistoryDate: (dateKey: string | null) => void;
  deleteHistoryDate: (dateKey: string) => void;
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
  setIsDarkMode,
  loadHistoryDate,
  deleteHistoryDate
}: HeaderProps) {
  const { keyError, autoLockEnabled } = useAutoLockStore();
  const { viewingDate, isReadOnly } = useHistoryStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="px-6 py-4 flex justify-between items-center bg-[var(--header-bg)] border-b border-[var(--border-color)] backdrop-blur-xl z-10 shrink-0 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/10 flex items-center justify-center transition-transform hover:scale-110 duration-300">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.png`} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-2">
            NEXT NOTEPAD
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-mono font-medium">v1.0.19</span>

            <div className="flex items-center gap-1.5 ml-1">
              {!isReadOnly && (
                <>
                  <button
                    onClick={() => setShowManual(true)}
                    title="사용 설명서"
                    className="p-1.5 rounded-lg hover:bg-slate-500/10 text-[var(--foreground)] opacity-40 hover:opacity-100 transition-all flex items-center justify-center"
                  >
                    <Icon icon="mdi:help-circle-outline" className="w-5 h-5" />
                  </button>
                  <SettingsButton />
                </>
              )}

              <ManualModal isOpen={showManual} onClose={() => setShowManual(false)} />

              {/* History Calendar - between Settings and Lock */}
              <Tooltip
                title={(isEncrypted && !isReadOnly)
                  ? "잠금을 해제해야 이력을 볼 수 있습니다. 먼저 잠금을 해제해주세요."
                  : (isEncrypted && isReadOnly)
                    ? "다른 날짜로 이동하거나 오늘로 돌아갈 수 있습니다."
                    : autoLockEnabled
                      ? "AUTO LOCK이 활성화된 상태에서는 이력을 볼 수 없습니다. AUTO LOCK을 먼저 해제해주세요."
                      : ""}
                arrow
                placement="bottom"
                disableHoverListener={!(isEncrypted && !isReadOnly) && !autoLockEnabled}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      whiteSpace: "nowrap",
                      maxWidth: "none",
                      '& .MuiTooltip-arrow': {
                        color: 'rgba(15, 23, 42, 0.9)',
                        '&::before': {
                          border: '1px solid var(--border-color)',
                        }
                      }
                    }
                  }
                }}
              >
                <div className="flex items-center">
                  <HistoryCalendar
                    onSelectDate={loadHistoryDate}
                    disabled={(isEncrypted && !isReadOnly) || autoLockEnabled}
                  />
                </div>
              </Tooltip>

              {isReadOnly && viewingDate && (
                <button
                  onClick={() => deleteHistoryDate(viewingDate)}
                  title="이력 삭제"
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center"
                >
                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={toggleEncryption}
                title={isReadOnly
                  ? (isEncrypted ? "이력 잠금 해제" : "과거 이력은 다시 잠글 수 없습니다")
                  : (isEncrypted ? "암호화 해제" : "암호화 잠금")}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${isEncrypted
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    : (isReadOnly ? "opacity-30 cursor-not-allowed text-slate-400" : "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20")
                  }`}
              >
                {isEncrypted ? (
                  keyError ? (
                    <Icon icon="mdi:lock-alert-outline" className="w-5 h-5" />
                  ) : (
                    autoLockEnabled ? (
                      <Icon icon="mdi:lock-reset" className="w-5 h-5" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )
                  )
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </h1>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium uppercase tracking-widest transition-all duration-300">
            {isReadOnly && viewingDate ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-500 font-bold">History: {viewingDate} (읽기 전용)</span>
              </>
            ) : (saveStatus === "saving" && !isEncrypted) ? (
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
            ) : (saveStatus === "success" && !isEncrypted) ? (
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
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Add Item"
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white transition-all shadow-lg shadow-cyan-500/20 active:scale-95 font-bold text-xs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{ minWidth: 220 }}
                className="absolute top-full right-0 mt-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 p-2 backdrop-blur-xl flex flex-col gap-1"
              >
                <button
                  onClick={() => {
                    addMemo("memo");
                    setShowAddMenu(false);
                  }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-cyan-500/10 text-[var(--foreground)] transition-colors text-sm font-medium text-left w-full"
                >
                  <Icon icon="mdi:file-document-outline" className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">New Memo</span>
                </button>
                <button
                  onClick={() => {
                    addMemo("todo");
                    setShowAddMenu(false);
                  }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-cyan-500/10 text-[var(--foreground)] transition-colors text-sm font-medium text-left w-full"
                >
                  <Icon icon="mdi:format-list-checks" className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">New To-Do List</span>
                </button>
                <button
                  onClick={() => {
                    addMemo("spreadsheet");
                    setShowAddMenu(false);
                  }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-cyan-500/10 text-[var(--foreground)] transition-colors text-sm font-medium text-left w-full"
                >
                  <Icon icon="mdi:google-spreadsheet" className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">New Spreadsheets</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            title="Download"
            className="flex items-center justify-center p-2.5 rounded-xl bg-[var(--header-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] border border-[var(--border-color)] transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <AnimatePresence>
            {showDownloadMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{ minWidth: 150 }}
                className="absolute top-full right-0 mt-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 p-2 backdrop-blur-xl flex flex-col gap-1"
              >
                <button
                  onClick={() => {
                    downloadData("current");
                    setShowDownloadMenu(false);
                  }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-cyan-500/10 text-[var(--foreground)] transition-colors text-sm font-medium text-left w-full"
                >
                  <Icon icon="mdi:calendar-today" className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">현재 날짜만</span>
                </button>
                <button
                  onClick={() => {
                    downloadData("full");
                    setShowDownloadMenu(false);
                  }}
                  className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-cyan-500/10 text-[var(--foreground)] transition-colors text-sm font-medium text-left w-full"
                >
                  <Icon icon="mdi:history" className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">전체 데이터</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
