"use client";

import * as React from "react";
import {
  Waves,
  Umbrella,
  Flower2,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Wine,
  Coffee,
  Wifi,
  Wind,
  Tv,
  GlassWater,
  DoorOpen,
  ShowerHead,
  Lock,
  BellRing,
  Car,
  Plane,
  TreePine,
  Palmtree,
  Bath,
  Sun,
  Moon,
  ConciergeBell,
  Droplets,
  Flame,
  Sofa,
  BedDouble,
  Dog,
  PartyPopper,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================
// Shared helpers — The Twenty-Fifth public site
// ============================================================

// Map amenity icon names (stored as strings) -> Lucide components
const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  Waves,
  Umbrella,
  Flower2,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Wine,
  Coffee,
  Wifi,
  Wind,
  Tv,
  GlassWater,
  DoorOpen,
  ShowerHead,
  Lock,
  BellRing,
  Car,
  Plane,
  TreePine,
  Palmtree,
  Bath,
  Sun,
  Moon,
  ConciergeBell,
  Droplets,
  Flame,
  Sofa,
  BedDouble,
  Dog,
  PartyPopper,
  UserCheck,
};

export function getAmenityIcon(name?: string | null): LucideIcon {
  if (!name) return Sparkles;
  return AMENITY_ICON_MAP[name] ?? Sparkles;
}

// Convenience alias kept for backwards-compatibility with older callers.
export const amenityIcon = getAmenityIcon;

// Simple opacity + small-y fade-up variant.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Stagger container — children fade up in sequence.
export const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// Convenience motion wrapper for a fade-up section.
export const FadeUpSection: React.FC<
  React.PropsWithChildren<{ className?: string; delay?: number }>
> = ({ children, className, delay = 0 }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
      },
    }}
  >
    {children}
  </motion.div>
);

// ============================================================
// SectionHeading — eyebrow + Playfair Display title + subtitle.
// Used on every public page for visual consistency.
// ============================================================
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        center && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg",
            center && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Standard Unsplash hero image — ocean beachfront.
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80";

// ============================================================
// SectionDivider — decorative divider between sections.
// Adds visual rhythm without being heavy.
// ============================================================
export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-1", className)}>
      <div className="h-px w-10 bg-border" />
      <span className="mx-3 text-xs text-coral/40 select-none">✦</span>
      <div className="h-px w-10 bg-border" />
    </div>
  );
}

// ============================================================
// useCountUp — animated number counter triggered on scroll.
// Counts from 0 to `target` over `duration` ms when the
// ref element scrolls into view (IntersectionObserver).
// ============================================================
export function useCountUp(target: number, duration = 1600) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [count, setCount] = React.useState(0);
  const started = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, count };
}

// ============================================================
// useThemeToggle — toggles .dark class on <html>, persists
// to localStorage. Same approach as admin.
// ============================================================
export function useThemeToggle() {
  const [dark, setDark] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("rrms-theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    setReady(true);
  }, []);

  const toggle = React.useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("rrms-theme", next ? "dark" : "light");
  }, [dark]);

  return { dark, toggle, ready };
}
