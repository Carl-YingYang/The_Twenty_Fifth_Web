"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESORT_INFO } from "@/lib/constants";
import { FadeUpSection } from "../shared";

const SUBJECTS = [
  "General Inquiry",
  "Reservation Question",
  "Special Occasion",
  "Group & Events",
  "Press & Media",
  "Careers",
  "Feedback",
];

const HOURS = [
  { day: "Monday – Friday", time: "7:00 AM – 9:00 PM" },
  { day: "Saturday – Sunday", time: "8:00 AM – 8:00 PM" },
  { day: "Concierge", time: "24 hours" },
];

export function ContactPage() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    subject: SUBJECTS[0],
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
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    toast.success("Message sent! Our concierge will respond within 24 hours.");
    setForm({
      name: "",
      email: "",
      phone: "",
      subject: SUBJECTS[0],
      message: "",
    });
  };

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-section py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative">
          <FadeUpSection className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              We're here to help
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Speak with our concierge
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you're planning a private celebration, asking about accessibility, or simply
              curious about the weather at Verdara — we would love to hear from you.
            </p>
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            {/* Form */}
            <FadeUpSection>
              <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-8">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Send us a message
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We typically respond within 24 hours.
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
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Eleanor Whitfield"
                          className="rounded-xl pl-9"
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
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@email.com"
                          className="rounded-xl pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="contact-phone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+63 917 555 0101"
                          className="rounded-xl pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Select
                        value={form.subject}
                        onValueChange={(v) => setForm({ ...form, subject: v })}
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">Message *</Label>
                    <Textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help — special requests, dates you're considering, accessibility needs…"
                      className="min-h-[140px] rounded-xl"
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
                <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-7">
                  <h3 className="font-display text-lg font-semibold">Resort Information</h3>
                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Address
                        </div>
                        <div className="mt-0.5 text-foreground">{RESORT_INFO.address}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Phone
                        </div>
                        <a
                          href={`tel:${RESORT_INFO.phone.replace(/\s/g, "")}`}
                          className="mt-0.5 block text-foreground transition-colors hover:text-primary"
                        >
                          {RESORT_INFO.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Email
                        </div>
                        <a
                          href={`mailto:${RESORT_INFO.email}`}
                          className="mt-0.5 block text-foreground transition-colors hover:text-primary"
                        >
                          {RESORT_INFO.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-7">
                  <h3 className="font-display text-lg font-semibold">Concierge Hours</h3>
                  <div className="mt-4 space-y-2.5">
                    {HOURS.map((h) => (
                      <div
                        key={h.day}
                        className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-b-0"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {h.day}
                        </span>
                        <span className="font-medium">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Map placeholder */}
                <Card className="overflow-hidden rounded-2xl border-border/60 p-0 shadow-luxury">
                  <div className="relative aspect-[4/3] w-full">
                    { }
                    <img
                      src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80"
                      alt="Verdara Resort location map"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3 backdrop-blur">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium">Verdara Resort</div>
                          <div className="text-xs text-muted-foreground">San Juan, Batangas</div>
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

      {/* Bottom CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-section py-12 text-center"
      >
        <div className="container-luxury">
          <p className="text-sm text-muted-foreground">
            Prefer to speak with us? Our concierge is available 24 hours.
          </p>
          <a href={`tel:${RESORT_INFO.phone.replace(/\s/g, "")}`}>
            <Button className="mt-4 rounded-full">
              <Phone className="h-4 w-4" />
              Call {RESORT_INFO.phone}
            </Button>
          </a>
        </div>
      </motion.section>
    </div>
  );
}
