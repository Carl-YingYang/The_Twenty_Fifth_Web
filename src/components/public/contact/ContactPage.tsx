"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  User,
  Instagram,
  Facebook,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RESORT_INFO } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import { FadeUpSection, SectionHeading } from "../shared";

// Brand icons (lucide doesn't ship Messenger / WhatsApp branded icons)
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
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
    </svg>
  );
}

export function ContactPage() {
  const navigate = useViewStore((s) => s.navigate);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in your name, email, and message");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    toast.success("Message sent! We'll respond within 24 hours.");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Contact"
              title="We'd love to hear from you."
              subtitle="Questions about dates, events, accessibility, or just curious about the weather at the villa? Send us a message — we typically respond within a few hours."
            />
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            {/* Form */}
            <FadeUpSection>
              <Card className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Send us a message
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We usually respond within a few hours, sometimes minutes.
                </p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">Full name *</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="contact-name"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          placeholder="Your name"
                          className="rounded-lg pl-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">Email *</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          placeholder="you@email.com"
                          className="rounded-lg pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contact-phone"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="+63 917 555 0101"
                        className="rounded-lg pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">Message *</Label>
                    <Textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      placeholder="Tell us about your dates, group size, or any questions you have…"
                      className="min-h-[140px] rounded-lg"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    size="lg"
                    className="w-full rounded-full sm:w-auto"
                  >
                    {submitting ? (
                      "Sending…"
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send message
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </FadeUpSection>

            {/* Info card */}
            <FadeUpSection delay={0.1}>
              <div className="space-y-6">
                <Card className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-7">
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

                {/* Social buttons */}
                <Card className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-7">
                  <h3 className="font-display text-lg font-semibold">
                    Find us online
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <SocialButton
                      href={RESORT_INFO.social.instagram}
                      label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </SocialButton>
                    <SocialButton
                      href={RESORT_INFO.social.facebook}
                      label="Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </SocialButton>
                    <SocialButton
                      href={RESORT_INFO.social.messenger}
                      label="Messenger"
                    >
                      <MessengerIcon className="h-4 w-4" />
                      Messenger
                    </SocialButton>
                    <SocialButton
                      href={RESORT_INFO.social.whatsapp}
                      label="WhatsApp"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      WhatsApp
                    </SocialButton>
                  </div>

                  <Button
                    onClick={() => navigate("book")}
                    className="mt-5 w-full rounded-full"
                    size="lg"
                  >
                    Book Your Stay
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              </div>
            </FadeUpSection>
          </div>
        </div>
      </section>
    </div>
  );
}

function SocialButton({
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
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-sand hover:text-primary"
    >
      {children}
    </a>
  );
}

function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
