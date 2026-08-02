"use client";

import { type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  loading?: boolean;
  className?: string;
}

const DELTA_TONE: Record<NonNullable<StatCardProps["deltaTone"]>, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  deltaTone = "neutral",
  loading,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden rounded-lg border border-border shadow-card transition-all hover:shadow-card-hover",
        className
      )}
    >
      {/* Accent stripe on the left edge — subtle, scales in on hover */}
      <span
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/80 via-primary/40 to-transparent opacity-70 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
        {Icon && (
          <div
            className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-primary"
            aria-hidden
          >
            {/* Soft halo */}
            <span className="absolute inset-0 rounded-full bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <Icon className="relative size-5" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="px-5 pb-5 pt-3">
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="font-display text-3xl font-medium tracking-tight text-foreground">
            {value}
          </div>
        )}
        {delta && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              DELTA_TONE[deltaTone]
            )}
          >
            {deltaTone === "up" && (
              <svg viewBox="0 0 12 12" className="size-3" fill="currentColor">
                <path d="M6 2L10 8H2L6 2Z" />
              </svg>
            )}
            {deltaTone === "down" && (
              <svg viewBox="0 0 12 12" className="size-3" fill="currentColor">
                <path d="M6 10L2 4H10L6 10Z" />
              </svg>
            )}
            {delta}
          </div>
        )}
        {!delta && hint && (
          <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "default" | "primary" | "danger" | "warning";
}) {
  const toneClasses = {
    default: "bg-sand text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    danger: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  }[tone];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-gradient-to-b from-card to-muted/30 px-6 py-14 text-center",
        className
      )}
    >
      {/* Soft halo behind icon for visual depth */}
      <div className="relative mb-4" aria-hidden>
        <div className={cn("absolute -inset-2 rounded-full bg-current opacity-5 blur-md", toneClasses)} />
        <div
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full ring-1 ring-inset ring-border/60",
            toneClasses
          )}
        >
          <Icon className="size-6" strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-base font-medium text-foreground">{title}</div>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default StatCard;
