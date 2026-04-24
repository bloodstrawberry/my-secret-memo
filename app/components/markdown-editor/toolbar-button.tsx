import { Icon } from "@iconify/react";
import { ICON_SIZE } from "./types";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: string;
  title: string;
  disabled?: boolean;
}

export function ToolbarButton({
  onClick,
  active,
  icon,
  title,
  disabled
}: ToolbarButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`
        p-1 rounded-lg transition-all duration-200
        ${active
          ? "bg-cyan-500/15 text-cyan-500 shadow-sm ring-1 ring-cyan-500/30"
          : "text-[var(--foreground)] opacity-60 hover:opacity-100 hover:bg-slate-500/10"}
        ${disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <Icon icon={icon} width={ICON_SIZE} height={ICON_SIZE} />
    </button>
  );
}

export function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-[var(--border-color)] self-center opacity-30" />;
}
