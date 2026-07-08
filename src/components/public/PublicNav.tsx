"use client";

import * as React from "react";
import { Menu, X, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { PUBLIC_NAV } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import { useMounted } from "@/hooks/useMounted";
import type { View } from "@/types";

export function PublicNav() {
  const navigate = useViewStore((s) => s.navigate);
  const currentView = useViewStore((s) => s.view);
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const mounted = useMounted();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (view: View) => {
    navigate(view);
    setOpen(false);
  };

  // Before mount, render a stable solid nav (matches SSR) to avoid hydration mismatch
  // and prevent a transparent nav over content on first paint.
  const isHome = currentView === "home";
  const solid = mounted && (scrolled || !isHome);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid
          ? "glass border-b border-border/60"
          : isHome
            ? "bg-transparent"
            : "glass border-b border-border/60"
      )}
    >
      <div className="container-luxury">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <button
            onClick={() => go("home")}
            className="group flex items-center gap-2"
            aria-label="Verdara Resort home"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                solid
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-white/30 bg-white/10 text-white"
              )}
            >
              <Leaf className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "font-display text-lg font-semibold tracking-[0.3em] transition-colors",
                solid ? "text-foreground" : "text-white"
              )}
            >
              VERDARA
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {PUBLIC_NAV.map((item) => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => go(item.view as View)}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm transition-colors",
                    solid
                      ? active
                        ? "text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground"
                      : active
                        ? "text-white font-medium"
                        : "text-white/80 hover:text-white"
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => go("admin-login")}
              className={cn(
                "hidden text-xs uppercase tracking-widest transition-colors md:inline-flex",
                solid
                  ? "text-foreground/50 hover:text-foreground"
                  : "text-white/60 hover:text-white"
              )}
            >
              Admin
            </button>

            <Button
              onClick={() => go("book")}
              size="sm"
              className={cn(
                "hidden rounded-full px-5 md:inline-flex",
                !solid && isHome && "bg-white text-primary hover:bg-white/90"
              )}
            >
              Book Now
            </Button>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "lg:hidden",
                    !solid && isHome && "text-white hover:bg-white/10 hover:text-white"
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-display tracking-[0.3em]">
                    VERDARA
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 px-4">
                  {PUBLIC_NAV.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => go(item.view as View)}
                      className={cn(
                        "rounded-xl px-4 py-3 text-left text-base transition-colors",
                        currentView === item.view
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}

                  <div className="my-3 h-px bg-border" />

                  <button
                    onClick={() => go("admin-login")}
                    className="rounded-xl px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                  >
                    Admin Login
                  </button>

                  <Button
                    onClick={() => go("book")}
                    className="mt-2 rounded-full"
                    size="lg"
                  >
                    Book Your Stay
                  </Button>

                  <button
                    onClick={() => go("find-reservation")}
                    className="mt-1 rounded-xl px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                  >
                    Find My Reservation
                  </button>
                </div>
                <div className="mt-auto p-4">
                  <SheetClose asChild>
                    <Button variant="ghost" size="sm" className="w-full">
                      <X className="h-4 w-4" />
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
