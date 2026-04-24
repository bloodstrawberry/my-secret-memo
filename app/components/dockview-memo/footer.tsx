interface FooterProps {
  totalWords: number;
  totalChars: number;
  memoCount: number;
}

export function Footer({ totalWords, totalChars, memoCount }: FooterProps) {
  return (
    <footer className="px-6 py-2 bg-[var(--footer-bg)] border-t border-[var(--border-color)] flex justify-between items-center z-10 shrink-0 transition-all duration-300">
      <div className="flex gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
        <span>Total Words: {totalWords}</span>
        <span>Total Chars: {totalChars}</span>
        <span>Memos: {memoCount}</span>
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        Organized with Dockview
      </div>
    </footer>
  );
}
