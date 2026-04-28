import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useHistoryStore } from "@/app/store/history-store";
import { useAutoLockStore } from "@/app/store/auto-lock-store";
import { memoDB } from "@/app/library/indexDB";

/** Get today's date as YYYY-MM-DD in local timezone */
function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface HistoryCalendarProps {
  onSelectDate: (dateKey: string | null) => void;
  disabled?: boolean;
}

export function HistoryCalendar({ onSelectDate, disabled }: HistoryCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [historyList, setHistoryList] = useState<string[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { viewingDate, isReadOnly } = useHistoryStore();
  const { autoLockEnabled, sessionKey } = useAutoLockStore();

  const isLocked = disabled;
  const todayKey = getTodayKey();

  const loadDates = useCallback(async () => {
    try {
      const keys = await memoDB.getAllHistoryKeys();
      setAvailableDates(new Set(keys));
      // Exclude today from the list as requested
      setHistoryList(keys.filter(k => k !== todayKey).sort((a, b) => b.localeCompare(a)));
    } catch (e) {
      console.error("Failed to load history keys:", e);
    }
  }, [todayKey]);

  useEffect(() => {
    if (isOpen && !isLocked) {
      loadDates();
    }
  }, [isOpen, isLocked, loadDates]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsListExpanded(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (dateKey: string | null) => {
    onSelectDate(dateKey);
    setIsOpen(false);
    setIsListExpanded(false);

    // If a historical date is selected, sync the calendar month/year
    if (dateKey) {
      const [y, m] = dateKey.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentYear(y);
        setCurrentMonth(m - 1);
      }
    } else {
      // If returning to Today, reset calendar to today's month/year
      const now = new Date();
      setCurrentYear(now.getFullYear());
      setCurrentMonth(now.getMonth());
    }
  };

  // Build grid cells
  const cells: { dateKey: string; day: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    const prevDays = getDaysInMonth(currentYear, currentMonth - 1);
    const day = prevDays - firstDay + 1 + i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ dateKey, day, isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ dateKey, day, isCurrentMonth: true });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dateKey, day: i, isCurrentMonth: false });
    }
  }

  return (
    <div className="relative" ref={calendarRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLocked}
        title={isLocked ? "잠금을 해제해야 이력을 볼 수 있습니다" : (isReadOnly ? `이력 보기: ${viewingDate}` : "과거 이력")}
        className={`ml-0 p-1.5 rounded-lg transition-all flex items-center justify-center ${
          isLocked
            ? "opacity-50 cursor-not-allowed bg-slate-500/5 text-slate-500/30"
            : isReadOnly
              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              : "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
        }`}
      >
        <Icon icon="mdi:calendar-clock" className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 backdrop-blur-xl overflow-hidden flex flex-col"
          >
            {isLocked ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Icon icon="mdi:lock-outline" className="w-10 h-10 text-red-400 mb-3 opacity-60" />
                <p className="text-sm font-bold text-red-400/80">잠금 상태</p>
                <p className="text-xs text-slate-500 mt-1">잠금을 해제해야 볼 수 있습니다.</p>
              </div>
            ) : (
              <>
                {/* CALENDAR SECTION */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-500/10 rounded-lg transition-colors">
                      <Icon icon="mdi:chevron-left" className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold">
                      {currentYear}년 {MONTHS[currentMonth]}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-500/10 rounded-lg transition-colors">
                      <Icon icon="mdi:chevron-right" className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map((day, i) => (
                      <div key={day} className={`text-center text-[10px] font-bold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-500"}`}>
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5">
                    {cells.map(({ dateKey, day, isCurrentMonth }, idx) => {
                      const isToday = dateKey === todayKey;
                      const hasData = availableDates.has(dateKey);
                      const isSelected = dateKey === viewingDate;
                      const isClickable = isCurrentMonth && (hasData || isToday);

                      return (
                        <button
                          key={`${dateKey}-${idx}`}
                          disabled={!isClickable}
                          onClick={() => isClickable && handleDateClick(isToday ? null : dateKey)}
                          className={`
                            relative flex items-center justify-center w-full aspect-square rounded-lg text-[11px] font-medium transition-all
                            ${!isCurrentMonth ? "text-slate-500/20 cursor-default" : ""}
                            ${isCurrentMonth && !hasData && !isToday ? "text-slate-500/40 cursor-default" : ""}
                            ${isCurrentMonth && (hasData || isToday) && !isSelected ? "text-[var(--foreground)] hover:bg-cyan-500/10 cursor-pointer" : ""}
                            ${isToday && !isSelected ? "bg-cyan-500/10 text-cyan-500 font-bold ring-1 ring-cyan-500/30" : ""}
                            ${isSelected ? "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30" : ""}
                          `}
                        >
                          {day}
                          {hasData && !isSelected && isCurrentMonth && (
                            <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? "bg-cyan-500" : "bg-emerald-500"}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DROPBOX (LIST) SECTION */}
                <div className="border-t border-[var(--border-color)] bg-slate-500/5">
                  <div 
                    className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-slate-500/5 transition-colors"
                    onClick={() => setIsListExpanded(!isListExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon 
                        icon="mdi:chevron-down" 
                        className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isListExpanded ? "rotate-0" : "-rotate-90"}`} 
                      />
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        이력 빠른 선택
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {historyList.length} Entries
                    </span>
                  </div>
                  
                  <AnimatePresence>
                    {isListExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                          {historyList.length === 0 ? (
                            <div className="py-6 text-center text-slate-500 opacity-60 flex flex-col items-center gap-1">
                              <Icon icon="mdi:calendar-blank-outline" className="w-6 h-6" />
                              <span className="text-[10px]">과거 이력이 없습니다.</span>
                            </div>
                          ) : (
                            historyList.map((date) => (
                              <button
                                key={date}
                                onClick={() => handleDateClick(date)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left group mb-0.5
                                  ${viewingDate === date ? "bg-amber-500/10 text-amber-500 font-bold" : "hover:bg-slate-500/10 text-[var(--foreground)]"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon icon="mdi:calendar-text-outline" className={`w-3.5 h-3.5 ${viewingDate === date ? "text-amber-500" : "text-slate-400 group-hover:text-amber-500"}`} />
                                  <span className="text-xs">{date}</span>
                                </div>
                                {viewingDate === date && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
