"use client";

import * as React from "react";
import {
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { RESORT_INFO, PUBLIC_NAV } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import type { View } from "@/types";

// Room type slugs the footer "The Villa" column links to.
const VILLA_LINKS: { label: string; view: View }[] = [
  { label: "The Whole Villa", view: "rooms" },
  { label: "Master Suite", view: "rooms" },
  { label: "Beachfront Suite", view: "rooms" },
  { label: "Garden Suite", view: "rooms" },
  { label: "Poolside Room", view: "rooms" },
];

// Messenger / WhatsApp icon (lucide doesn't ship these specific brand icons).
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.973 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
    </svg>
  );
}

export function PublicFooter() {
  const navigate = useViewStore((s) => s.navigate);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#0A3D4A] text-white/80">
      <div className="container-luxury py-10 sm:py-12 lg:py-16">
        {/* ───────────────────────────────────────────────────────
            MOBILE LAYOUT (default) — compact, single-column with
            a 2-col link grid. Designed to be short and scannable.
        ─────────────────────────────────────────────────────── */}

        {/* Brand row — logo + socials inline, compact */}
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              {RESORT_INFO.name}
            </span>
            <span className="mt-1 text-[0.5rem] font-medium uppercase tracking-[0.28em] text-white/50">
              Botolan · Zambales
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SocialLink href={RESORT_INFO.social.instagram} label="Instagram">
              <Instagram className="h-3.5 w-3.5" />
            </SocialLink>
            <SocialLink href={RESORT_INFO.social.facebook} label="Facebook">
              <Facebook className="h-3.5 w-3.5" />
            </SocialLink>
            <SocialLink href={RESORT_INFO.social.messenger} label="Messenger">
              <MessengerIcon className="h-3.5 w-3.5" />
            </SocialLink>
            <SocialLink href={RESORT_INFO.social.whatsapp} label="WhatsApp">
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </SocialLink>
          </div>
        </div>

        {/* Compact contact strip — icons only on mobile, single row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 lg:hidden">
          <a
            href={`tel:${RESORT_INFO.phoneRaw}`}
            className="flex items-center gap-1.5 text-xs text-white/70 transition-colors hover:text-coral"
          >
            <Phone className="h-3 w-3 text-coral" />
            {RESORT_INFO.phone}
          </a>
          <a
            href={`mailto:${RESORT_INFO.email}`}
            className="flex items-center gap-1.5 text-xs text-white/70 transition-colors hover:text-coral"
          >
            <Mail className="h-3 w-3 text-coral" />
            Email
          </a>
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <Clock className="h-3 w-3 text-coral" />
            {RESORT_INFO.checkInTime} / {RESORT_INFO.checkOutTime}
          </span>
        </div>

        {/* 2-column link grid — Explore | The Villa */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1 lg:hidden">
          <div>
            <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/40">
              Explore
            </h3>
            <ul className="mt-2.5 space-y-1.5">
              {PUBLIC_NAV.slice(0, 4).map((item) => (
                <li key={item.view}>
                  <button
                    onClick={() => navigate(item.view as View)}
                    className="text-xs text-white/70 transition-colors hover:text-coral"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/40">
              The Villa
            </h3>
            <ul className="mt-2.5 space-y-1.5">
              {VILLA_LINKS.slice(0, 4).map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.view)}
                    className="text-xs text-white/70 transition-colors hover:text-coral"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile secondary links — About, FAQs, Contact, Book */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 lg:hidden">
          {PUBLIC_NAV.slice(4).map((item) => (
            <button
              key={item.view}
              onClick={() => navigate(item.view as View)}
              className="text-xs text-white/70 transition-colors hover:text-coral"
            >
              {item.label}
            </button>
          ))}
          <span className="text-white/20">·</span>
          <button
            onClick={() => navigate("find-reservation")}
            className="text-xs text-white/70 transition-colors hover:text-coral"
          >
            Find My Booking
          </button>
        </div>

        {/* Mobile CTA button */}
        <button
          onClick={() => navigate("book")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 text-sm font-medium text-coral-foreground transition-colors hover:bg-coral/90 lg:hidden"
        >
          Book Your Stay
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        {/* ───────────────────────────────────────────────────────
            DESKTOP LAYOUT (lg+) — full 4-column grid
        ─────────────────────────────────────────────────────── */}
        <div className="hidden gap-12 lg:grid lg:grid-cols-4">
          {/* Column 1 — Brand + story + socials */}
          <div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                {RESORT_INFO.name}
              </span>
              <span className="mt-1 text-[0.55rem] font-medium uppercase tracking-[0.32em] text-white/50">
                Zambales
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              {RESORT_INFO.story}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <SocialLink href={RESORT_INFO.social.instagram} label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={RESORT_INFO.social.facebook} label="Facebook">
                <Facebook className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={RESORT_INFO.social.messenger} label="Messenger">
                <MessengerIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={RESORT_INFO.social.whatsapp} label="WhatsApp">
                <WhatsAppIcon className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Explore
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {PUBLIC_NAV.map((item) => (
                <li key={item.view}>
                  <button
                    onClick={() => navigate(item.view as View)}
                    className="text-white/70 transition-colors hover:text-coral"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigate("book")}
                  className="text-white/70 transition-colors hover:text-coral"
                >
                  Book Your Stay
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("find-reservation")}
                  className="text-white/70 transition-colors hover:text-coral"
                >
                  Find My Booking
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — The Villa */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              The Villa
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {VILLA_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.view)}
                    className="text-white/70 transition-colors hover:text-coral"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Get in touch */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Get in Touch
            </h3>
            <div className="mt-5 space-y-4 text-sm">
              <a
                href={`tel:${RESORT_INFO.phoneRaw}`}
                className="flex items-start gap-3 text-white/70 transition-colors hover:text-coral"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                <span>{RESORT_INFO.phone}</span>
              </a>
              <a
                href={`mailto:${RESORT_INFO.email}`}
                className="flex items-start gap-3 text-white/70 transition-colors hover:text-coral"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                <span>{RESORT_INFO.email}</span>
              </a>
              <p className="flex items-start gap-3 text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                <span>{RESORT_INFO.address}</span>
              </p>
              <p className="flex items-start gap-3 text-white/70">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                <span>
                  Check-in {RESORT_INFO.checkInTime}
                  <br />
                  Check-out {RESORT_INFO.checkOutTime}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:mt-10 sm:flex-row sm:pt-6">
          <p className="text-[0.7rem] text-white/50 sm:text-xs">
            © {year} {RESORT_INFO.name}. All rights reserved.
          </p>
          {/* P0 security: the Admin Login button has been removed from the
              public footer. Admins access the panel by visiting the URL
              ?view=admin-login directly. This avoids advertising the admin
              surface to casual resort guests. */}
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-coral hover:bg-coral/10 hover:text-coral"
    >
      {children}
    </a>
  );
}
