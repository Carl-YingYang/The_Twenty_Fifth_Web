"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  ExternalLink,
  Home,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Users,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import { cn, getInitials, timeAgo } from "@/lib/utils";
import { ADMIN_NAV, RESORT_INFO } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useViewStore } from "@/store/useViewStore";
import { useMounted } from "@/hooks/useMounted";
import type { Notification, User, View } from "@/types";

import { AdminLogin } from "./AdminLogin";
import { ConfirmDialog } from "./ConfirmDialog";
import { AdminCopilot } from "./copilot/AdminCopilot";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Home,
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const mounted = useMounted();

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

  // Theme init — read from localStorage on mount (legitimate hydration pattern)
  useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? localStorage.getItem("rrms-theme")
      : null) as "light" | "dark" | null;
    const initial = stored ?? "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("rrms-theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  if (!mounted) {
    return <AdminLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (isAuthenticated && verifying && !meData) {
    return <AdminLayoutSkeleton />;
  }

  const onLogout = async () => {
    try {
      // P0 security: clear the signed NextAuth JWT cookie via signOut().
      // The old /api/auth/logout endpoint is deprecated (returns 410).
      const { signOut } = await import("next-auth/react");
      await signOut({ redirect: false });
    } catch {
      // ignore — the local store is cleared below regardless
    }
    logout();
    toast.success("Signed out");
    navigate("home");
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const SidebarContent = (
    <SidebarBody
      currentView={view}
      user={user}
      onNavigate={(v) => {
        navigate(v);
        setMobileNavOpen(false);
      }}
      onLogout={() => setConfirmLogout(true)}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
          {SidebarContent}
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-72 border-0 p-0"
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
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <main className="min-h-0 flex-1 p-4 pb-16 sm:p-6 sm:pb-6 lg:p-8">{children}</main>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        tone="default"
        title="Sign out of admin?"
        description="You'll need to sign in again to continue managing The Twenty-Fifth. Any unsaved work in open forms will be lost."
        confirmLabel="Sign out"
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
      />

      {/* Aria — the admin operations copilot (controlled AI automation) */}
      <AdminCopilot />
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
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
          <Waves className="size-5 text-coral" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-medium tracking-tight text-white">
            {RESORT_INFO.name}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-coral">
            Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3"
        aria-label="Admin navigation"
      >
        {ADMIN_NAV.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view as View)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 font-semibold text-white shadow-sm ring-1 ring-white/10"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-coral"
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-coral" : "text-sidebar-foreground/60 group-hover:text-white"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User block */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-9 border border-white/10 bg-white/10">
            <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
              {user ? getInitials(user.name) : "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">
              {user?.name ?? "Admin"}
            </div>
            <div className="truncate text-[11px] capitalize text-sidebar-foreground/60">
              {String(user?.role ?? "admin").toLowerCase().replace("_", " ")}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="size-8 text-sidebar-foreground/60 hover:bg-white/5 hover:text-coral"
            title="Sign out"
            aria-label="Sign out"
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
  theme,
  onToggleTheme,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onOpenMobileNav: () => void;
  user: User | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const { navigate } = useViewStore();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
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
        <h1 className="truncate font-display text-xl font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
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
          <AvatarFallback className="bg-sand text-xs font-semibold text-primary">
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
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);

  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAllRead: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        `Marked ${unread.length} notification${unread.length === 1 ? "" : "s"} as read.`
      );
      setConfirmMarkAll(false);
    },
    onError: () => {
      toast.error("Couldn't mark notifications as read.");
    },
  });

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-coral text-[9px] font-bold text-coral-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="text-sm font-semibold text-foreground">
            Notifications
          </div>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
              disabled={markAllRead.isPending}
              onClick={() => setConfirmMarkAll(true)}
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
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 border-b border-border px-3 py-2.5 transition-colors last:border-0 hover:bg-muted/50",
                  !n.isRead && "bg-coral/5"
                )}
              >
                <div className="mt-1.5">
                  {!n.isRead ? (
                    <span className="size-2 rounded-full bg-coral" />
                  ) : (
                    <span className="size-2 rounded-full bg-transparent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {n.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {n.message}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <ConfirmDialog
      open={confirmMarkAll}
      onOpenChange={setConfirmMarkAll}
      tone="info"
      title="Mark all notifications as read?"
      description={`This will mark all ${unread.length} unread notification${unread.length === 1 ? "" : "s"} as read. You can still review them in the list.`}
      confirmLabel="Mark all read"
      loading={markAllRead.isPending}
      onConfirm={() => markAllRead.mutate()}
    />
    </>
  );
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 shrink-0 bg-sidebar lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border bg-background px-8">
          <Skeleton className="h-5 w-40" />
          <div className="flex-1" />
          <Skeleton className="size-9 rounded-full" />
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
