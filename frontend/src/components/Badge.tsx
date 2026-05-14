import React, { ReactNode } from "react";

type BadgeVariant = "blue" | "green" | "red" | "gray" | "default" | "amber" | "violet";

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  onRemove?: () => void;
  children?: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue: "border-sky-300/30 bg-[linear-gradient(180deg,rgba(76,155,255,0.18),rgba(255,255,255,0.06))] text-sky-700 dark:text-sky-200",
  green: "border-emerald-300/30 bg-[linear-gradient(180deg,rgba(56,214,171,0.18),rgba(255,255,255,0.06))] text-emerald-700 dark:text-emerald-200",
  red: "border-rose-300/30 bg-[linear-gradient(180deg,rgba(255,103,136,0.18),rgba(255,255,255,0.06))] text-rose-700 dark:text-rose-200",
  gray: "border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] text-slate-700 dark:text-slate-200",
  default: "border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] text-slate-700 dark:text-slate-200",
  amber: "border-amber-300/30 bg-[linear-gradient(180deg,rgba(255,190,92,0.18),rgba(255,255,255,0.06))] text-amber-700 dark:text-amber-200",
  violet: "border-violet-300/30 bg-[linear-gradient(180deg,rgba(158,128,255,0.18),rgba(255,255,255,0.06))] text-violet-700 dark:text-violet-200",
};

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', onRemove, children }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-[0_8px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-md ${variantClasses[variant]}`}
    >
      {children ?? label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-white/12"
          aria-label={`移除 ${label ?? ''}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge;
