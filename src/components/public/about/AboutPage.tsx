"use client";

import * as React from "react";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewStore } from "@/store/useViewStore";
import { RESORT_INFO } from "@/lib/constants";
import { FadeUpSection, SectionHeading } from "../shared";

const STATS = [
  { value: "4", label: "Bedrooms" },
  { value: "21", label: "Beds" },
  { value: "5.5", label: "Baths" },
  { value: "25", label: "Guests" },
];

const NARRATIVES = [
  {
    eyebrow: "The Coast",
    title: "Shaped by the ocean.",
    body:
      "The Twenty-Fifth sits on a quiet stretch of Botolan coastline in Zambales, where the days are marked only by tides and the sun melting into the West Philippine Sea. From the deck, you watch the water change colour — silver at dawn, deep teal by noon, molten gold at dusk. There is no traffic here, no agenda. Just the rhythm of the waves against the sand.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Botolan coastline at golden hour",
  },
  {
    eyebrow: "The Grounds",
    title: "Softened by coastal pine.",
    body:
      "Behind the villa, a stand of coastal pine and palm provides shade and quiet. The infinity pool looks out to the sea; the dipping pool is tucked into the garden for early-morning swims. Open-air lounges invite long afternoons with a book. We built this place for the kind of stillness that only the coast can offer — and we've kept it deliberately low-key.",
    image:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Coastal palms by the villa",
  },
  {
    eyebrow: "The Welcome",
    title: "Space for connection.",
    body:
      "We built The Twenty-Fifth for gatherings — family reunions, barkada getaways, milestone birthdays, intimate weddings. With four bedrooms, twenty-one beds, a fully equipped kitchen, and direct beach access, the villa holds up to twenty-five guests comfortably. Our caretaker lives on-site and is happy to help with anything you need, from setting up a BBQ to arranging a celebration.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Outdoor dining table set for a group",
  },
];

const MAPS_QUERY = encodeURIComponent(RESORT_INFO.address);

export function AboutPage() {
  const navigate = useViewStore((s) => s.navigate);

  return (
    <div className="pt-12 sm:pt-16">
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="container-luxury relative z-10 pb-12 pt-24">
          <FadeUpSection>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-coral">
              Our Story
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              The Twenty-Fifth
            </h1>
          </FadeUpSection>
        </div>
      </section>

      {/* Intro paragraphs */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="container-tight">
          <FadeUpSection>
            <p className="font-display text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl">
              {RESORT_INFO.story}
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {RESORT_INFO.description}
            </p>
          </FadeUpSection>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-[#0A3D4A] py-14 text-white">
        <div className="container-luxury">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <FadeUpSection
                key={s.label}
                delay={i * 0.06}
                className="text-center"
              >
                <div className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                  {s.label}
                </div>
              </FadeUpSection>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative sections */}
      {NARRATIVES.map((n, idx) => (
        <NarrativeSection key={n.title} {...n} reverse={idx % 2 === 1} />
      ))}

      {/* Location */}
      <section className="border-t border-border bg-section py-16 sm:py-20">
        <div className="container-luxury">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <FadeUpSection>
              <SectionHeading
                eyebrow="Find Us"
                title="Find us in Botolan."
                subtitle={`The Twenty-Fifth is in Panan, Botolan, Zambales — about a 3 to 4-hour drive from Manila via SCTEX. We'll send detailed directions once your booking is confirmed.`}
              />
              <div className="mt-6 space-y-3 text-sm text-foreground">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                  <span>{RESORT_INFO.address}</span>
                </p>
                <p className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                  <a
                    href={`tel:${RESORT_INFO.phoneRaw}`}
                    className="transition-colors hover:text-primary"
                  >
                    {RESORT_INFO.phone}
                  </a>
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex"
              >
                <Button
                  variant="outline"
                  className="rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white"
                >
                  Get Directions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </FadeUpSection>

            <FadeUpSection delay={0.1}>
              {/* Google Maps embed */}
              <div className="relative overflow-hidden rounded-xl border border-border shadow-card">
                <iframe
                  src="https://maps.google.com/maps?q=Panan+Botolan+Zambales+Philippines&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: "0.625rem" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="The Twenty-Fifth location map"
                />
              </div>
            </FadeUpSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-coral py-16 text-white sm:py-20">
        <div className="container-luxury flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <FadeUpSection>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Come and stay a while.
            </h2>
            <p className="mt-3 max-w-xl text-white/85">
              The beach is waiting, the kettle is on, and the villa is yours
              for the asking.
            </p>
          </FadeUpSection>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate("book")}
              size="lg"
              className="rounded-full bg-white text-coral hover:bg-white/90"
            >
              Book Your Stay
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a href={`tel:${RESORT_INFO.phoneRaw}`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              >
                <Phone className="h-4 w-4" />
                Call the villa
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function NarrativeSection({
  eyebrow,
  title,
  body,
  image,
  imageAlt,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="container-luxury">
        <div
          className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
            reverse ? "lg:[direction:rtl]" : ""
          }`}
        >
          <FadeUpSection className={reverse ? "lg:[direction:ltr]" : ""}>
            <div className="aspect-[4/3] overflow-hidden rounded-xl">
              <img
                src={image}
                alt={imageAlt}
                className="img-zoom h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </FadeUpSection>
          <FadeUpSection
            delay={0.1}
            className={reverse ? "lg:[direction:ltr]" : ""}
          >
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">{body}</p>
          </FadeUpSection>
        </div>
      </div>
    </section>
  );
}
