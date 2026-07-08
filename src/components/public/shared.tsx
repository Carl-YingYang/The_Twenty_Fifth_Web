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
