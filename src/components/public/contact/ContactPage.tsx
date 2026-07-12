"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RESORT_INFO } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import { FadeUpSection, SectionHeading } from "../shared";

// WhatsApp brand icon (lucide doesn't ship a WhatsApp-branded glyph).
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

// The social channels the client wants featured (no contact form).
// Each links directly to the resort's real profile so guests can
// reach the team without a server-side form handler.
const SOCIAL_CHANNELS = [
  {
    name: "Facebook",
    href: RESORT_INFO.social.facebook,
    handle: RESORT_INFO.social.facebookHandle,
    description: "Message us on Facebook for quick replies.",
    icon: Facebook,
    accent: "bg-[#1877F2]",
  },
  {
    name: "Instagram",
    href: RESORT_INFO.social.instagram,
    handle: RESORT_INFO.social.instagramHandle,
    description: "See latest photos, stories, and guest moments.",
    icon: Instagram,
    accent: "bg-gradient-to-br from-[#E4405F] via-[#F77737] to-[#FCAF45]",
  },
  {
    name: "WhatsApp",
    href: RESORT_INFO.social.whatsapp,
    handle: RESORT_INFO.phone,
    description: "Chat with us directly on WhatsApp.",
    icon: WhatsAppIcon,
    accent: "bg-[#25D366]",
  },
  {
    name: "Messenger",
    href: RESORT_INFO.social.messenger,
    handle: "Chat instantly",
    description: "Send us a message via Facebook Messenger.",
    icon: MessageCircle,
    accent: "bg-[#0084FF]",
  },
] as const;

export function ContactPage() {
  const navigate = useViewStore((s) => s.navigate);

  return (
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Contact"
              title="Let's talk."
              subtitle="The fastest way to reach us is through our social channels. Pick whichever you already use — we reply within a few hours, sometimes minutes."
            />
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
            {/* Social channels — the primary contact method */}
            <FadeUpSection>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Reach us on social
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap a channel below to start a conversation.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {SOCIAL_CHANNELS.map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <a
                        key={ch.name}
                        href={ch.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                      >
                        <span
                          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${ch.accent} text-white transition-transform group-hover:scale-105`}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-display text-base font-semibold text-foreground">
                            {ch.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {ch.handle}
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {ch.description}
                          </p>
                        </div>
                        <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    );
                  })}
                </div>

                <Button
                  onClick={() => navigate("book")}
                  className="mt-6 w-full rounded-md sm:w-auto"
                  size="lg"
                >
                  Book Your Stay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </FadeUpSection>

            {/* Info card — direct contact details */}
            <FadeUpSection delay={0.1}>
              <div className="space-y-6">
                <Card className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-7">
                  <h3 className="font-display text-lg font-semibold">
                    Reach us directly
                  </h3>
                  <div className="mt-5 space-y-4 text-sm">
                    <a
                      href={`tel:${RESORT_INFO.phoneRaw}`}
                      className="flex items-start gap-3 text-foreground transition-colors hover:text-primary"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Phone
                        </div>
                        <div className="mt-0.5 font-display text-base font-semibold">
                          {RESORT_INFO.phone}
                        </div>
                      </div>
                    </a>
                    <a
                      href={`mailto:${RESORT_INFO.email}`}
                      className="flex items-start gap-3 text-foreground transition-colors hover:text-primary"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Email
                        </div>
                        <div className="mt-0.5 font-medium">
                          {RESORT_INFO.email}
                        </div>
                      </div>
                    </a>
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Address
                        </div>
                        <div className="mt-0.5 font-medium">
                          {RESORT_INFO.address}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                        <Clock className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Check-in / Check-out
                        </div>
                        <div className="mt-0.5 font-medium">
                          {formatTimeLabel(RESORT_INFO.checkInTime)} ·{" "}
                          {formatTimeLabel(RESORT_INFO.checkOutTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </FadeUpSection>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
