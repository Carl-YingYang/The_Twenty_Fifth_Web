"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LogOut,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ConfirmTone = "destructive" | "warning" | "success" | "info" | "default";

const TONE_CONFIG: Record<
  ConfirmTone,
  { icon: LucideIcon; iconClass: string; actionClass: string; ring: string }
> = {
  destructive: {
    icon: Trash2,
    iconClass: "text-destructive",
    actionClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ring: "ring-destructive/20",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500 dark:text-amber-400",
    actionClass:
      "bg-amber-600 text-white hover:bg-amber-600/90 focus-visible:ring-amber-600/20 dark:bg-amber-500 dark:hover:bg-amber-500/90",
    ring: "ring-amber-500/20",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    actionClass:
      "bg-emerald-700 text-white hover:bg-emerald-700/90 focus-visible:ring-emerald-700/20 dark:bg-emerald-500 dark:hover:bg-emerald-500/90",
    ring: "ring-emerald-600/20",
  },
  info: {
    icon: Info,
    iconClass: "text-primary",
    actionClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    ring: "ring-primary/20",
  },
  default: {
    icon: LogOut,
    iconClass: "text-muted-foreground",
    actionClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    ring: "ring-primary/20",
  },
};

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Called with `false` when the user dismisses (cancel / overlay / esc). */
  onOpenChange: (open: boolean) => void;
  /** Dialog title. */
  title: string;
  /** Longer description of consequences. */
  description: React.ReactNode;
  /** Text for the confirm button. */
  confirmLabel?: string;
  /** Text for the cancel button. */
  cancelLabel?: string;
  /** Tone drives icon + button color. */
  tone?: ConfirmTone;
  /** Show a spinner + disable while the action runs. */
  loading?: boolean;
  /** Triggered on confirm. Await-able; dialog stays open (loading) until resolved. */
  onConfirm: () => void | Promise<void>;
  /** Optional small hint shown under the description (e.g. "This cannot be undone."). */
  hint?: string;
}

/**
 * Reusable confirmation dialog for admin actions.
 *
 * Wraps shadcn/ui AlertDialog with a consistent tone-based icon + button style,
 * a loading state on the confirm button, and Escape/overlay cancellation that
 * is blocked while a request is in-flight (safer for destructive ops).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  hint,
}: ConfirmDialogProps) {
  const cfg = TONE_CONFIG[tone];
  const Icon = cfg.icon;

  const handleOpenChange = (next: boolean) => {
    // Block dismissal while an action is in-flight to avoid orphaned requests.
    if (!next && loading) return;
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={cn("max-w-md", "ring-1", cfg.ring)}>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
                cfg.iconClass
              )}
              aria-hidden
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1 leading-relaxed">
                {description}
              </AlertDialogDescription>
              {hint ? (
                <p className="mt-2 text-xs font-medium text-muted-foreground/80">
                  {hint}
                </p>
              ) : null}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={cfg.actionClass}
            disabled={loading}
            onClick={(e) => {
              // Prevent the default Radix auto-close so we can keep the loading
              // state visible until the async action resolves.
              e.preventDefault();
              void onConfirm();
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {confirmLabel.replace(/…?$/, "ing…")}
              </span>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
