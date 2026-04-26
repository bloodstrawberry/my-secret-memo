"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useSettings, DEFAULT_SETTINGS } from "@/app/context/settings-context";
import { useMemoStore } from "@/app/components/dockview";
import { useAutoLockStore } from "@/app/store/auto-lock-store";
import { showSecurePrompt } from "@/app/components/secure-prompt";
import { toast } from "@/app/components/toast";
import { memoDB } from "@/app/library/indexDB";
import { DEFAULT_MEMOS, DEFAULT_TITLES } from "@/app/constants/default";
import { encryptMemosText } from "@/app/components/dockview/utils";
import { useLoadingOverlay } from "@/app/store/loading-overlay-store";

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
              <span>{settings.lineHeight}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
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
        <div className="flex flex-col gap-1.5">
          <AutoLockToggle />
          <MemoResetButton />
        </div>
      </div>
    </motion.div >
  );
}

function AutoLockToggle() {
  const { autoLockEnabled, setAutoLockEnabled, setSessionKey, keyError, setKeyError, sessionKey } = useAutoLockStore();
  const { memos, titles, isEncrypted } = useMemoStore();

  const isDisabled = keyError || isEncrypted;

  const handleToggle = () => {
    if (isDisabled) return;

    if (!autoLockEnabled) {
      // Turning ON: prompt for key, encrypt, enable auto-lock
      showSecurePrompt("AUTO LOCK 키를 입력하세요", async (key) => {
        if (!key) return;

        useLoadingOverlay.getState().show("암호화 중...");

        // Encrypt the current memos and save with isEncrypted flag
        const STORAGE_KEY = "my-secret-key";
        let data = await memoDB.getItem<any>(STORAGE_KEY);
        if (!data) {
          data = { memos, titles };
        }
        const memosToEncrypt = data.memos || memos;
        data.memos = encryptMemosText(memosToEncrypt, key);
        data.isEncrypted = true;
        data.autoLock = true;

        const { default: CryptoJS } = await import("crypto-js");
        data.encryptedKey = CryptoJS.AES.encrypt(key, "my-secret-memo-salt").toString();

        await memoDB.setItem(STORAGE_KEY, data);

        // Store key in memory only (NOT persisted)
        setSessionKey(key);
        setAutoLockEnabled(true);
        setKeyError(false);

        toast.success("AUTO LOCK이 활성화되었습니다.");
        // Reload to show locked state
        setTimeout(() => window.location.reload(), 800);
      }, { placeholder: "암호화 키 입력" });
    } else {
      // Turning OFF: confirm first, then decrypt and disable
      showSecurePrompt("AUTO LOCK 해제 키를 입력하세요", async (key) => {
        if (!key) return;

        useLoadingOverlay.getState().show("복호화 중...");

        const STORAGE_KEY = "my-secret-key";
        const data = await memoDB.getItem<any>(STORAGE_KEY);
        if (data && data.isEncrypted && data.memos) {
          let isValid = false;
          if (data.encryptedKey) {
            const { default: CryptoJS } = await import("crypto-js");
            const bytes = CryptoJS.AES.decrypt(data.encryptedKey, "my-secret-memo-salt");
            const decKey = bytes.toString(CryptoJS.enc.Utf8);
            isValid = (decKey === key);
          } else {
            isValid = true; // Fallback
          }

          if (!isValid) {
            useLoadingOverlay.getState().hide();
            setKeyError(true);
            return;
          }

          const { decryptMemosText } = await import("@/app/components/dockview/utils");
          const decryptedMemos = decryptMemosText(data.memos, key);
          data.memos = decryptedMemos;
          data.isEncrypted = false;
          data.autoLock = false;
          data.encryptedKey = null;
          await memoDB.setItem(STORAGE_KEY, data);

          setSessionKey(null);
          setAutoLockEnabled(false);
          setKeyError(false);

          toast.success("AUTO LOCK이 해제되었습니다.");
          setTimeout(() => window.location.reload(), 800);
        } else {
          useLoadingOverlay.getState().hide();
          setSessionKey(null);
          setAutoLockEnabled(false);
          setKeyError(false);
          toast.info("AUTO LOCK이 해제되었습니다.");
        }
      }, { placeholder: "복호화 키 입력" });
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${autoLockEnabled
        ? isDisabled
          ? "bg-red-500/10 text-red-500 opacity-50 cursor-not-allowed"
          : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 active:scale-95"
        : isDisabled
          ? "bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed"
          : "bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 active:scale-95"
        }`}
    >
      <Icon
        icon={
          autoLockEnabled
            ? isDisabled
              ? "mdi:lock-alert-outline"
              : "material-symbols:lock"
            : isDisabled
              ? "mdi:lock-alert-outline"
              : "material-symbols:lock-open-outline"
        }
        className="w-3.5 h-3.5"
      />
      {autoLockEnabled
        ? (keyError ? "KEY MISMATCH" : "AUTO LOCK ON")
        : "AUTO LOCK OFF"}
    </button>
  );
}

function MemoResetButton() {
  const { resetData } = useMemoStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
      >
        <Icon icon="material-symbols:delete-sweep-outline" className="w-3.5 h-3.5" />
        초기화
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col gap-1 p-2 bg-slate-500/5 rounded-2xl border border-[var(--border-color)] shadow-sm"
    >
      <div className="flex justify-between items-center px-2 py-1.5 mb-1">
        <span className="text-[10px] font-bold text-[var(--foreground)] opacity-70 uppercase tracking-[0.15em]">Reset Mode</span>
        <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-slate-500/10 rounded-full transition-colors">
          <Icon icon="material-symbols:close" className="w-3.5 h-3.5 text-[var(--foreground)] opacity-40" />
        </button>
      </div>

      <button
        onClick={() => { resetData("options"); setIsExpanded(false); }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-all text-sm font-bold text-left w-full group"
      >
        <Icon icon="material-symbols:settings-backup-restore" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="whitespace-nowrap">옵션 초기화</span>
      </button>

      <button
        onClick={() => { resetData("memos"); setIsExpanded(false); }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 transition-all text-sm font-bold text-left w-full group"
      >
        <Icon icon="material-symbols:description-outline" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="whitespace-nowrap">메모장 초기화</span>
      </button>

      <button
        onClick={() => { resetData("todos"); setIsExpanded(false); }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all text-sm font-bold text-left w-full group"
      >
        <Icon icon="mdi:format-list-checks" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="whitespace-nowrap">To-Do List 초기화</span>
      </button>

      <div className="my-1 border-t border-[var(--border-color)] opacity-30" />

      <button
        onClick={() => { resetData("all"); setIsExpanded(false); }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all text-sm font-bold text-left w-full group"
      >
        <Icon icon="material-symbols:warning-outline" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="whitespace-nowrap">전체 초기화</span>
      </button>
    </motion.div>
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

