"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BedDouble,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Images,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn, getInitials, timeAgo } from "@/lib/utils";
import { ADMIN_NAV } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useViewStore } from "@/store/useViewStore";
import type { Notification, User, View } from "@/types";

import { AdminLogin } from "./AdminLogin";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  BedDouble,
  Users,
  Sparkles,
  Images,
  BarChart3,
  Settings,
};

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AdminLayout({ title, subtitle, children, actions }: AdminLayoutProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { view, navigate } = useViewStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Verify token validity on mount
  const { data: meData, isLoading: verifying } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<{ user: User | null }>("/api/auth/me"),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (meData && !meData.user) {
      logout();
      navigate("admin-login");
    }
  }, [meData, logout, navigate]);

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // While verifying token, show a brief skeleton so we don't flash the login page
  if (isAuthenticated && verifying && !meData) {
    return <AdminLayoutSkeleton />;
  }

  const SidebarContent = (
    <SidebarBody
      currentView={view}
      user={user}
      onNavigate={(v) => {
        navigate(v);
        setMobileNavOpen(false);
      }}
      onLogout={async () => {
        try {
          await apiFetch("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore
        }
        logout();
        toast.success("Signed out");
        navigate("home");
      }}
    />
  );

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
          {SidebarContent}
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-72 border-0 p-0 data-[state=open]:slide-in-from-left"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {SidebarContent}
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            title={title}
            subtitle={subtitle}
            actions={actions}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            user={user}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarBody({
  currentView,
  user,
  onNavigate,
  onLogout,
}: {
  currentView: View;
  user: User | null;
  onNavigate: (v: View) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-[#0F2E22] text-emerald-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-900/40">
          <Leaf className="size-5 text-white" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold leading-tight text-white">
            Verdara
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/60">
            Admin Suite
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <div className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200/40">
          Manage
        </div>
        {ADMIN_NAV.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view as View)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-emerald-500/15 text-emerald-300 shadow-[inset_2px_0_0_0_#34D399]"
                  : "text-emerald-100/70 hover:bg-white/5 hover:text-emerald-50"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-emerald-300" : "text-emerald-200/60 group-hover:text-emerald-100"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="size-3.5 text-emerald-300/80" />}
            </button>
          );
        })}
      </nav>

      {/* User block */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-9 border border-white/10 bg-emerald-700/40">
            <AvatarFallback className="bg-emerald-700/40 text-xs font-semibold text-emerald-50">
              {user ? getInitials(user.name) : "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">
              {user?.name ?? "Admin"}
            </div>
            <div className="truncate text-[11px] capitalize text-emerald-200/60">
              {String(user?.role ?? "admin").toLowerCase().replace("_", " ")}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="size-8 text-emerald-200/60 hover:bg-white/5 hover:text-rose-300"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopBar({
  title,
  subtitle,
  actions,
  onOpenMobileNav,
  user,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onOpenMobileNav: () => void;
  user: User | null;
}) {
  const { navigate } = useViewStore();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <NotificationsBell />
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("home")}
          className="hidden h-9 gap-1.5 sm:inline-flex"
        >
          <ExternalLink className="size-3.5" />
          View Site
        </Button>
        <Avatar className="size-9 border border-border">
          <AvatarFallback className="bg-emerald-50 text-xs font-semibold text-emerald-700">
            {user ? getInitials(user.name) : "AD"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function NotificationsBell() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ notifications: Notification[] }>("/api/notifications"),
    refetchInterval: 60 * 1000,
  });

  const items = data?.notifications ?? [];
  const unread = items.filter((n) => !n.isRead);

  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAllRead: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 items-center justify-center">
              <span className="absolute size-2 animate-ping rounded-full bg-rose-400/70" />
              <span className="size-2 rounded-full bg-rose-500" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <div className="text-sm font-semibold">Notifications</div>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-emerald-700 hover:text-emerald-800"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="mx-auto mb-2 size-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 border-b px-3 py-2.5 transition-colors last:border-0 hover:bg-muted/50",
                  !n.isRead && "bg-emerald-50/50"
                )}
              >
                <div className="mt-1.5">
                  {!n.isRead ? (
                    <span className="size-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="size-2 rounded-full bg-transparent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.message}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center text-xs"
            onClick={() => {}}
          >
            View all activity
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <div className="hidden w-64 shrink-0 bg-[#0F2E22] lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b bg-background px-8">
          <Skeleton className="h-5 w-40" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="space-y-4 p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
