import * as React from 'react';
import { useContext } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { MemoContext } from './context';
import { toast } from '@/app/components/toast';
import { useVisualToggleStore } from "@/app/store/visual-toggle-store";
import CryptoJS from "crypto-js";
import { decryptSingleMemo } from "./utils";

interface LockedViewProps {
  panelId: string;
}

export const LockedView = ({ panelId }: LockedViewProps) => {
  const { memos, updateMemo } = useContext(MemoContext);
  const { tabLocks, toggleTabLock } = useVisualToggleStore();

  const handleUnlockClick = () => {
    toast.passwordPrompt("비밀번호를 입력하여 잠금을 해제하세요", (val) => {
      if (!val) return;
      const hash = CryptoJS.SHA256(val).toString();
      if (hash === tabLocks[panelId]) {
        try {
          const currentContent = memos[panelId];
          const decrypted = decryptSingleMemo(panelId, currentContent, val);
          toggleTabLock(panelId, false);
          updateMemo(panelId, decrypted, true);
          toast.success("잠금이 해제되었습니다.");
        } catch (e) {
          toast.error("복호화에 실패했습니다.");
        }
      } else {
        toast.error("비밀번호가 일치하지 않습니다.");
      }
    });
  };
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[var(--panel-bg)] overflow-hidden relative transition-colors duration-300">
      {/* Decorative Grid - subtle dots */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />

      <div className="relative flex flex-col items-center justify-center z-10">
        {/* Animated HUD Element - Clean & Minimal */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Outer Thin Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-[var(--foreground)] opacity-10 rounded-full"
          />

          {/* Accent Segment Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-t border-b border-[var(--dv-active-tab-text)] opacity-40 rounded-full"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 30%, 0 70%, 100% 70%, 100% 100%, 0 100%)' }}
          />

          {/* Inner Pulsing Ring */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-6 bg-[var(--dv-active-tab-text)] rounded-full"
          />

          {/* Core Icon */}
          <motion.button
            onClick={handleUnlockClick}
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
            whileTap={{ scale: 0.9 }}
            className="z-20 w-16 h-16 bg-[var(--panel-bg)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-white/5 hover:border-[var(--dv-active-tab-text)] transition-colors cursor-pointer outline-none"
          >
            <Icon icon="material-symbols:lock-outline" width={32} height={32} className="text-[var(--dv-active-tab-text)]" />
          </motion.button>
        </div>

        {/* Text Information */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center px-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-[var(--dv-active-tab-text)] tracking-[0.2em] uppercase opacity-60">
              Encrypted Session
            </span>
          </div>

          {/* Subtle Progress bar decoration */}
          <div className="w-32 h-0.5 bg-[var(--border-color)] rounded-full overflow-hidden mt-2">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-1/2 h-full bg-[var(--dv-active-tab-text)] opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Decorative corners - subtle theme-aware lines */}
      <div className="absolute top-12 left-12 w-8 h-8 border-t border-l border-[var(--foreground)] opacity-[0.08]" />
      <div className="absolute top-12 right-12 w-8 h-8 border-t border-r border-[var(--foreground)] opacity-[0.08]" />
      <div className="absolute bottom-12 left-12 w-8 h-8 border-b border-l border-[var(--foreground)] opacity-[0.08]" />
      <div className="absolute bottom-12 right-12 w-8 h-8 border-b border-r border-[var(--foreground)] opacity-[0.08]" />
    </div>
  );
};
