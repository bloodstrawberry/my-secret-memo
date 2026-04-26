import * as React from 'react';
import { Icon } from '@iconify/react';

export const LockedView = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[var(--panel-bg)]/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-[var(--panel-bg)] border border-[var(--border-color)] shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
          <Icon icon="material-symbols:lock-outline" width={32} height={32} />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-lg font-bold text-[var(--foreground)]">비밀 메모가 잠겨있습니다</h3>
          <p className="text-sm text-[var(--foreground)] opacity-60">
            상단 도구 모음의 <Icon icon="material-symbols:visibility-off-outline" className="inline mb-0.5" /> 아이콘을 눌러<br />
            비밀번호를 입력하고 잠금을 해제하세요.
          </p>
        </div>
      </div>
    </div>
  );
};
