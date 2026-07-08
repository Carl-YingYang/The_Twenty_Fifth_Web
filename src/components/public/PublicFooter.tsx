"use client";

import * as React from "react";
import { Instagram, Facebook, Twitter, Leaf, MapPin, Phone, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RESORT_INFO, PUBLIC_NAV } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import type { View } from "@/types";

const EXPERIENCES = [
  { label: "Forest Spa", view: "amenities" as View },
  { label: "Farm-to-Table Dining", view: "amenities" as View },
  { label: "Private Beach", view: "amenities" as View },
  { label: "Yoga Pavilion", view: "amenities" as View },
  { label: "Nature Trails", view: "gallery" as View },
];

export function PublicFooter() {
  const navigate = useViewStore((s) => s.navigate);
  const [email, setEmail] = React.useState("");

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    toast.success("Thank you for subscribing! Check your inbox for our welcome letter.");
    setEmail("");
  };

  return (
    <footer className="mt-auto bg-[#0F2E22] text-white/80">
      <div className="container-luxury py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Resort info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-[0.3em] text-white">
                VERDARA
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              {RESORT_INFO.tagline}. An immersive luxury escape where the rainforest meets the coast.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/70">
              <a
                href={`mailto:${RESORT_INFO.email}`}
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-emerald-300" />
                {RESORT_INFO.email}
              </a>
              <a
                href={`tel:${RESORT_INFO.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-emerald-300" />
                {RESORT_INFO.phone}
              </a>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{RESORT_INFO.address}</span>
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PUBLIC_NAV.map((item) => (
                <li key={item.view}>
                  <button
                    onClick={() => navigate(item.view as View)}
                    className="text-white/70 transition-colors hover:text-emerald-300"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigate("book")}
                  className="text-white/70 transition-colors hover:text-emerald-300"
                >
                  Book Your Stay
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("find-reservation")}
                  className="text-white/70 transition-colors hover:text-emerald-300"
                >
                  Find My Reservation
                </button>
              </li>
            </ul>
          </div>

          {/* Experiences */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Experiences
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {EXPERIENCES.map((exp) => (
                <li key={exp.label}>
                  <button
                    onClick={() => navigate(exp.view)}
                    className="text-white/70 transition-colors hover:text-emerald-300"
                  >
                    {exp.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              The Verdara Letter
            </h4>
            <p className="mt-4 text-sm text-white/60">
              Seasonal stories, curated offers, and quiet moments from the forest. Sent monthly.
            </p>
            <form onSubmit={onSubscribe} className="mt-4 space-y-2.5">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-emerald-300/60"
              />
              <Button
                type="submit"
                className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
              >
                <Send className="h-3.5 w-3.5" />
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {RESORT_INFO.name}. All rights reserved. Crafted with care.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={RESORT_INFO.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={RESORT_INFO.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={RESORT_INFO.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
