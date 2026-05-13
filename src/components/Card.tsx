import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </div>
      )}
    </Card>
  );
}
