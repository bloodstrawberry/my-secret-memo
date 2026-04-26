import * as React from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

export const LockedView = () => {
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
          <div className="z-20 w-16 h-16 bg-[var(--panel-bg)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-white/5">
            <Icon icon="material-symbols:lock-outline" width={32} height={32} className="text-[var(--dv-active-tab-text)]" />
          </div>
        </div>

        {/* Text Information */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center px-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-[var(--dv-active-tab-text)] tracking-[0.2em] uppercase opacity-60">
              Encrypted Session
            </span>
            <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
              비밀 메모가 잠겨있습니다
            </h3>
          </div>

          <p className="text-sm text-[var(--foreground)] opacity-60 leading-relaxed max-w-[260px]">
            상단 도구 모음의 <Icon icon="material-symbols:visibility-off-outline" className="inline mb-0.5 text-[var(--dv-active-tab-text)]" /> 아이콘을 눌러<br />
            비밀번호를 입력하고 잠금을 해제하세요.
          </p>

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
