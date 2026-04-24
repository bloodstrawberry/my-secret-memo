"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useSettings, DEFAULT_SETTINGS } from "./settings-context";
import { useMemoStore } from "./dockview-memo";

export function SettingsPopover({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full left-0 mt-2 w-72 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 p-5 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest opacity-80">Editor Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-500/10 rounded-full transition-colors">
            <Icon icon="material-symbols:close" className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-60">
              <span>Font Size</span>
              <span>{settings.fontSize}</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              step="1"
              value={parseInt(settings.fontSize)}
              onChange={(e) => updateSettings({ fontSize: `${e.target.value}px` })}
              className="w-full h-1.5 bg-cyan-500/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-60">
              <span>Line Height</span>
              <span>{settings.lineHeight}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.1"
              value={parseFloat(settings.lineHeight)}
              onChange={(e) => updateSettings({ lineHeight: e.target.value })}
              className="w-full h-1.5 bg-cyan-500/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-60">
              <span>Letter Spacing</span>
              <span>{settings.letterSpacing}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="5"
              step="0.5"
              value={parseFloat(settings.letterSpacing)}
              onChange={(e) => updateSettings({ letterSpacing: `${e.target.value}px` })}
              className="w-full h-1.5 bg-cyan-500/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Max Width */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-60">
              <span>Max Width</span>
              <span>{settings.maxWidth === "100%" ? "Full" : settings.maxWidth}</span>
            </div>
            <div className="flex gap-2">
              {["600px", "800px", "1000px", "100%"].map((w) => (
                <button
                  key={w}
                  onClick={() => updateSettings({ maxWidth: w })}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${settings.maxWidth === w
                    ? "bg-cyan-500 border-cyan-500 text-white"
                    : "border-[var(--border-color)] hover:bg-slate-500/5 text-[var(--foreground)]"
                    }`}
                >
                  {w === "100%" ? "Full" : w}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Font Family</div>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--foreground)] outline-none focus:ring-1 focus:ring-cyan-500/30"
            >
              <option value="'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif">Pretendard</option>
              <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
              <option value="'JeonSoMin', sans-serif">전소민체</option>
              <option value="'Consolas', 'Monaco', monospace">Consolas (Mono)</option>
              <option value="var(--font-open-sans), sans-serif">Open Sans</option>
              <option value="var(--font-montserrat), sans-serif">Montserrat</option>
              <option value="var(--font-roboto), sans-serif">Roboto</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="var(--font-lora), serif">Lora (Serif)</option>
              <option value="var(--font-jetbrains-mono), monospace">JetBrains Mono</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
            </select>
          </div>
        </div>
        <div className="border-t border-[var(--border-color)] opacity-50" />
        <MemoResetButton />
      </div>
    </motion.div >
  );
}

function MemoResetButton() {
  // We need to import useMemoStore but it might cause circular dependency if we import from dockview-memo
  // However, in Next.js/React this is usually okay if it's just types/context.
  // To be safe, I'll use a dynamic approach or just ensure dockview-memo is imported.
  const { resetData } = useMemoStore();

  return (
    <button
      onClick={resetData}
      className="flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
    >
      <Icon icon="material-symbols:delete-sweep-outline" className="w-4 h-4" />
      초기화
    </button>
  );
}

export default function SettingsButton() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`p-1.5 rounded-lg transition-all ${showSettings ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "hover:bg-slate-500/10 text-[var(--foreground)] opacity-40 hover:opacity-100"}`}
      >
        <Icon icon="material-symbols:settings-outline" className={`w-5 h-5 ${showSettings ? "animate-spin-slow" : ""}`} />
      </button>

      <AnimatePresence>
        {showSettings && (
          <SettingsPopover
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
