"use client";

import * as React from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { PUBLIC_NAV, RESORT_INFO } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import { useMounted } from "@/hooks/useMounted";
import { useThemeToggle } from "@/components/public/shared";
import type { View } from "@/types";

export function PublicNav() {
  const navigate = useViewStore((s) => s.navigate);
  const currentView = useViewStore((s) => s.view);
  const [open, setOpen] = React.useState(false);
  const mounted = useMounted();
  const { dark, toggle: toggleTheme, ready: themeReady } = useThemeToggle();

  // Lock body scroll when mobile sheet is open.
  React.useEffect(() => {
    if (!mounted) return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const go = (view: View) => {
    navigate(view);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container-luxury">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Wordmark */}
          <button
            onClick={() => go("home")}
            className="group flex flex-col items-start leading-none"
            aria-label={`${RESORT_INFO.name} home`}
          >
            <span className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {RESORT_INFO.name}
            </span>
            <span className="mt-0.5 text-[0.55rem] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              Zambales
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
            {PUBLIC_NAV.map((item) => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => go(item.view as View)}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-coral" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Vertical divider between nav and actions (desktop only) */}
            <span className="hidden h-6 w-px bg-border lg:block" aria-hidden="true" />

            {/* Dark mode toggle */}
            {mounted && themeReady && (
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-9 sm:w-9"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => go("find-reservation")}
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Find My Booking
            </button>
            <Button
              onClick={() => go("book")}
              size="sm"
              className="hidden rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 md:inline-flex"
            >
              Book Your Stay
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile slide-down sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="top"
          className="flex flex-col gap-0 border-b border-border p-0 sm:max-w-full"
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border p-4">
            <SheetTitle className="font-display text-lg tracking-tight">
              {RESORT_INFO.name}
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </SheetHeader>

          <nav
            className="flex flex-col gap-1 p-4"
            aria-label="Mobile"
          >
            {PUBLIC_NAV.map((item) => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => go(item.view as View)}
                  className={cn(
                    "flex min-h-[44px] items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </button>
              );
            })}

            <div className="my-2 h-px bg-border" />

            <button
              onClick={() => go("find-reservation")}
              className="flex min-h-[44px] items-center rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-muted"
            >
              Find My Booking
            </button>

            <Button
              onClick={() => go("book")}
              size="lg"
              className="mt-3 min-h-[48px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Book Your Stay
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
