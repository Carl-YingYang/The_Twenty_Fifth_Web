"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "emerald" | "amber" | "sky" | "rose" | "violet";
  loading?: boolean;
}

const ACCENT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  accent = "emerald",
  loading,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="gap-0 rounded-2xl border-border/70 shadow-luxury">
        <div className="flex items-start justify-between px-5 pt-5">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              ACCENT[accent]
            )}
          >
            <Icon className="size-5" />
          </div>
          {trend && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                trend === "up" && "bg-emerald-50 text-emerald-700",
                trend === "down" && "bg-rose-50 text-rose-700",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <div className="px-5 pb-5 pt-3">
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </div>
          )}
          <div className="mt-1 text-sm font-medium text-foreground/80">{label}</div>
          {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </div>
      </Card>
    </motion.div>
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
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
