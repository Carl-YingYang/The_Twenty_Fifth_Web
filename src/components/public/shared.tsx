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
  type LucideIcon,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";

// ============================================================
// Shared helpers for the public website
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
  Waves,
};

export function getAmenityIcon(name?: string | null): LucideIcon {
  if (!name) return Sparkles;
  return AMENITY_ICON_MAP[name] ?? Sparkles;
}

// Standard Framer Motion variants used across the site
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// Convenience motion component for a fade-up section
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
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay } },
    }}
  >
    {children}
  </motion.div>
);

// Standard Unsplash image used for the resort "brand" feel
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80";

export const PLACEHOLDER_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
];
