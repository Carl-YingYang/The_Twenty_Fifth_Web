"use client";

import * as React from "react";
import { Menu, X, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import type { View } from "@/types";

export function PublicNav() {
  const navigate = useViewStore((s) => s.navigate);
  const currentView = useViewStore((s) => s.view);
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

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

  const isHome = currentView === "home";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "glass border-b border-border/60 shadow-luxury"
          : "bg-transparent"
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
                scrolled || !isHome
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-white/30 bg-white/10 text-white"
              )}
            >
              <Leaf className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "font-display text-lg font-semibold tracking-[0.3em] transition-colors",
                scrolled || !isHome ? "text-foreground" : "text-white"
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
                    (scrolled || !isHome)
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
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
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
                scrolled || !isHome
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
                "hidden rounded-full px-5 shadow-sm md:inline-flex",
                !scrolled && isHome && "bg-white text-primary hover:bg-white/90"
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
                    !scrolled && isHome && "text-white hover:bg-white/10 hover:text-white"
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
                  <AnimatePresence>
                    {PUBLIC_NAV.map((item, i) => (
                      <motion.button
                        key={item.view}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        onClick={() => go(item.view as View)}
                        className={cn(
                          "rounded-xl px-4 py-3 text-left text-base transition-colors",
                          currentView === item.view
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground/80 hover:bg-muted"
                        )}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                  </AnimatePresence>

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
    </motion.header>
  );
}
