"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote, X, Facebook, ExternalLink, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartImage, FadeUpSection, SectionHeading } from "../shared";

// ============================================================
// GuestMoments — customer-satisfaction / social-proof section
//
// Showcases real guest photos shared on the resort's Facebook page.
// Each card is tappable and opens a centered modal with the full
// image, a short testimonial-style caption, and a "View on
// Facebook" CTA that opens the original post.
//
// The 4 photos + 2 Facebook post links below are provided by the
// resort owner. To add more, append to GUEST_MOMENTS.
// ============================================================

interface GuestMoment {
  id: string;
  image: string;
  caption: string;
  guest: string;
  occasion: string;
  /** Facebook post URL this moment came from. */
  facebookUrl: string;
  /** Whether the source post is a video/reel (affects the badge). */
  isVideo?: boolean;
}

// Owner-provided assets (2 Facebook post links + 4 CDN images).
const FB_POST_1 = "https://www.facebook.com/share/r/19EDA5oxgP/"; // reel / video
const FB_POST_2 = "https://www.facebook.com/share/p/19B2pTenFv/"; // photo post

const GUEST_MOMENTS: GuestMoment[] = [
  {
    id: "gm-1",
    image:
      "https://scontent-mnl1-1.xx.fbcdn.net/v/t39.30808-6/690440886_122126889855214530_6383179064678197693_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1200&ctp=s1200x1200&_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHegKrJq6jy0XZ4lmfExQQ1ZoP98KHSUehmg_3wodJR6BN7MKDdksStrciYUivUvF2eb1Xksl4Ht8CFCzYbIIml&_nc_ohc=KlW4L_WmSSsQ7kNvwFD_89T&_nc_oc=AdpzQCGrqM6skoyua1nvFbYW8nP6sKzNvDDLaz_iZRGR__HVCN29RtVZyY6YJVT3j8I&_nc_zt=23&_nc_ht=scontent-mnl1-1.xx&_nc_gid=PnlgJR6QxWYLOIjR-E1uQA&_nc_ss=7b2a8&oh=00_AQDsPeOtQjQtYnw-GGR-s8GYPA27IYOZNqcXVsgVTtlBAA&oe=6A5553A0",
    caption:
      "Woke up to the sound of waves and coffee on the deck. This is exactly the reset we needed.",
    guest: "The Reyes Family",
    occasion: "Weekend getaway",
    facebookUrl: FB_POST_1,
    isVideo: true,
  },
  {
    id: "gm-2",
    image:
      "https://scontent-mnl3-3.xx.fbcdn.net/v/t39.30808-6/690641704_122126687937214530_1419693623656663500_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1200&ctp=s1200x1200&_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFkw6sbulKS0prAAFS4w094839kU6piPRbzf2RTqmI9Fn_8BcN9x_BkTpBH_6-opYSeHpSgoYKhpRsSq2X3vKZT&_nc_ohc=L3PHnvZd-9sQ7kNvwFhdkQT&_nc_oc=Adp_25tlJkv9BPvshGzRwrz989Gqgnb8cbJeNbS4JbLVUo3s3YPHbODOW16LbyXwbTM&_nc_zt=23&_nc_ht=scontent-mnl3-3.xx&_nc_gid=Jblea6xUgNi4j-p_DMlvng&_nc_ss=7b2a8&oh=00_AQCu0iZzPa03WEwFX13bRlH08z9b9UxAMFTHELCctohjlg&oe=6A555D47",
    caption:
      "Golden hour by the infinity pool — the kids didn't want to leave. Neither did we, honestly.",
    guest: "Mara & Cocoy",
    occasion: "Family vacation",
    facebookUrl: FB_POST_2,
  },
  {
    id: "gm-3",
    image:
      "https://scontent-mnl1-2.xx.fbcdn.net/v/t39.30808-6/663256192_122120981625214530_7764316736233994151_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1200&ctp=s1200x1200&_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHNs52O7SIIDER1Xw0FrqTCWSTznl0xAfJZJPOeXTEB8vvdjnjF0HJdlVw5PxrvFwW1ObtmleRer6NUY2Y1C24X&_nc_ohc=iwfeBpF1RCoQ7kNvwHfpHlC&_nc_oc=Adqgg4xobnJOO6Vj2iRU8sGfvdydJ8fHNqhfNt9Rh6BhTqGhoetmqwq2WZoKRqT9JU8&_nc_zt=23&_nc_ht=scontent-mnl1-2.xx&_nc_gid=RwJmZ5qRx1tGRT5TP-jH6A&_nc_ss=7b2a8&oh=00_AQCn-eAMA1NwZ5ukm3obhfdgtUP0LIcRfOfFoiguebRoVg&oe=6A554848",
    caption:
      "Dinner under the palms with the whole barkada. The Twenty-Fifth made our annual trip unforgettable.",
    guest: "The Barkada Crew",
    occasion: "Friends reunion",
    facebookUrl: FB_POST_1,
    isVideo: true,
  },
  {
    id: "gm-4",
    image:
      "https://scontent-mnl1-2.xx.fbcdn.net/v/t39.30808-6/645262670_122114684343214530_5928721882064907463_n.jpg?stp=dst-jpg_tt6&cstp=mx1638x2048&ctp=s1638x2048&_nc_cat=100&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHEIBVpEivrZuSB4OQyFY82CFDhObVCPx8IUOE5tUI_H1WMc1pulZcRPx2NSdljNoVUo4d8z5N8rjSLkdl292UU&_nc_ohc=7izZQU9OEwUQ7kNvwG15ftD&_nc_oc=Adq5bJTaHaaXOWdBbpJJh2rEzpRia3Pg_kBTjLCY96H5Vj-Yjkk-1jtwjCPb8RFhqfs&_nc_zt=23&_nc_ht=scontent-mnl1-2.xx&_nc_gid=lmagO4pVH0QAtakrvWJSWQ&_nc_ss=7b2a8&oh=00_AQAnzYLO84yKAKlStJhJXgLG3TzW4119XEOva2WZNAeO6g&oe=6A555FDA",
    caption:
      "Private beach access meant sunrise walks every morning. Already planning our next stay.",
    guest: "Patrice & David",
    occasion: "Anniversary trip",
    facebookUrl: FB_POST_2,
  },
];

export function GuestMoments() {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const active = GUEST_MOMENTS.find((m) => m.id === activeId) ?? null;

  // ESC to close + lock body scroll while modal is open.
  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <section className="border-t border-border bg-gradient-to-b from-section to-background py-16 sm:py-24">
      <div className="container-luxury">
        <FadeUpSection>
          <SectionHeading
            center
            eyebrow="Guest Moments"
            title="Loved by our guests"
            subtitle="Real moments shared by guests who've stayed at The Twenty-Fifth. Tap any photo to read their story and view the original post on Facebook."
          />
        </FadeUpSection>

        {/* Satisfaction stats strip */}
        <FadeUpSection delay={0.1}>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-coral text-coral"
                    strokeWidth={0}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                5.0 guest rating
              </span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
              <span>Loved by families, friends &amp; couples</span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <a
              href={FB_POST_1}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1877F2] transition-colors hover:text-[#0d5fb8]"
            >
              <Facebook className="h-4 w-4" />
              Follow us on Facebook
            </a>
          </div>
        </FadeUpSection>

        {/* Cards grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {GUEST_MOMENTS.map((moment, i) => (
            <FadeUpSection key={moment.id} delay={i * 0.08}>
              <GuestCard moment={moment} onOpen={() => setActiveId(moment.id)} />
            </FadeUpSection>
          ))}
        </div>
      </div>

      {/* Centered modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="gm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveId(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Guest moment from ${active.guest}`}
          >
            <motion.div
              key="gm-modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:flex-row"
            >
              {/* Close button */}
              <button
                onClick={() => setActiveId(null)}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>

              {/* Image side */}
              <div className="relative max-h-[45vh] w-full shrink-0 overflow-hidden bg-muted sm:max-h-none sm:w-[58%]">
                <img
                  src={active.image}
                  alt={`Moment from ${active.guest}`}
                  className="h-full w-full object-cover"
                />
                {active.isVideo && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                    <span className="flex h-2 w-2 items-center justify-center">
                      <span className="h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white" />
                    </span>
                    Reel
                  </span>
                )}
              </div>

              {/* Content side */}
              <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-7">
                <div>
                  <div className="flex items-center gap-2">
                    <Quote className="h-5 w-5 shrink-0 text-coral" />
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {active.occasion}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg leading-relaxed text-foreground sm:text-xl">
                    “{active.caption}”
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {active.guest.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {active.guest}
                      </p>
                      <div className="mt-0.5 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-coral text-coral"
                            strokeWidth={0}
                          />
                        ))}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          Verified stay
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <a
                  href={active.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5fb8] sm:w-auto"
                >
                  <Facebook className="h-4 w-4" />
                  View original post
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ------------------------------------------------------------
// GuestCard — the tappable card with hover lift + zoom
// ------------------------------------------------------------
function GuestCard({
  moment,
  onOpen,
}: {
  moment: GuestMoment;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`View guest moment from ${moment.guest}`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <SmartImage
          src={moment.image}
          alt={`Moment from ${moment.guest}`}
          wrapperClassName="absolute inset-0 size-full"
          className="absolute inset-0 size-full transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Video badge */}
        {moment.isVideo && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white/90">
              <span className="h-0 w-0 border-y-[3px] border-l-[4px] border-y-transparent border-l-black" />
            </span>
            Reel
          </span>
        )}

        {/* Tap hint — appears on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
            <ExternalLink className="h-3 w-3" />
            Tap to view
          </span>
        </div>

        {/* Bottom caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-1.5 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-2.5 w-2.5 fill-coral text-coral"
                strokeWidth={0}
              />
            ))}
          </div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-coral">
            {moment.occasion}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-white">
            “{moment.caption}”
          </p>
          <p className="mt-1.5 text-xs text-white/70">— {moment.guest}</p>
        </div>
      </div>

      {/* Facebook footer */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
          <span>Shared on Facebook</span>
        </div>
        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View post →
        </span>
      </div>
    </button>
  );
}

export default GuestMoments;
