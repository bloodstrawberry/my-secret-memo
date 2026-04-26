interface FooterProps {
  totalWords: number;
  totalChars: number;
  memoCount: number;
  lastUpdated?: string | null;
}

export function Footer({ totalWords, totalChars, memoCount, lastUpdated }: FooterProps) {
  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    : 'Never';

  return (
    <footer className="px-6 py-2 bg-[var(--footer-bg)] border-t border-[var(--border-color)] flex justify-between items-center z-10 shrink-0 transition-all duration-300">
      <div className="flex gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider items-center">
        <span>Total Words: {totalWords}</span>
        <span>Total Chars: {totalChars}</span>
        <span>Memos: {memoCount}</span>
        <span className="ml-2 pl-4 border-l border-slate-300 dark:border-slate-700">Last Updated: {formattedDate}</span>
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        Organized with Dockview
      </div>
    </footer>
  );
}
