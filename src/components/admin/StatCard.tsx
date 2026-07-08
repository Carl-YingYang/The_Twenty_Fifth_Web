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
  up: "text-emerald-700",
  down: "text-red-700",
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
        "gap-0 rounded-xl border border-border shadow-card transition-opacity",
        className
      )}
    >
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
        {Icon && (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-primary"
            aria-hidden
          >
            <Icon className="size-5" />
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
              "mt-1 text-xs font-medium",
              DELTA_TONE[deltaTone]
            )}
          >
            {delta}
          </div>
        )}
        {!delta && hint && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
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
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      <div
        className="mb-3 flex size-12 items-center justify-center rounded-full bg-sand text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-5" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default StatCard;
