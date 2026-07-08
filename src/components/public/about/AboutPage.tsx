"use client";

import * as React from "react";
import {
  Leaf,
  TreePine,
  Waves,
  Users,
  Sparkles,
  Heart,
  Globe2,
  Recycle,
  HandHeart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useViewStore } from "@/store/useViewStore";
import { FadeUpSection } from "../shared";

const STATS = [
  { icon: <TreePine className="h-5 w-5" />, value: "13", label: "Private villas & suites" },
  { icon: <Leaf className="h-5 w-5" />, value: "12 acres", label: "Rainforest preserved" },
  { icon: <Sparkles className="h-5 w-5" />, value: "5-star", label: "Consistently rated" },
  { icon: <Users className="h-5 w-5" />, value: "Since 2018", label: "Welcoming guests" },
];

const VALUES = [
  {
    icon: <HandHeart className="h-5 w-5" />,
    title: "Hospitality, deeply felt",
    description:
      "We treat each guest as a personal guest of the family. Every interaction — from arrival to departure — is rooted in genuine care.",
  },
  {
    icon: <Recycle className="h-5 w-5" />,
    title: "Stewardship of place",
    description:
      "We operate with a net-positive ethos: solar power, rainwater harvesting, a no-single-use-plastic policy, and active rainforest regeneration.",
  },
  {
    icon: <Globe2 className="h-5 w-5" />,
    title: "Rooted in locale",
    description:
      "Our chefs, therapists, and guides are local. Our ingredients are local. Our craft — from linens to architecture — is local. Verdara is, unmistakably, of Batangas.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Quiet excellence",
    description:
      "We measure success not in stars or accolades, but in the silence of a guest who has, finally, slowed down. That is the only metric that matters to us.",
  },
];

export function AboutPage() {
  const navigate = useViewStore((s) => s.navigate);

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="container-luxury relative z-10 pb-12 pt-24">
          <FadeUpSection>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300">
              Our Story
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              A quiet rebellion against the hurried world.
            </h1>
          </FadeUpSection>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-b border-border/60 bg-section">
        <div className="container-luxury py-10">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <FadeUpSection key={s.label} delay={i * 0.06}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {s.icon}
                  </span>
                  <div>
                    <div className="font-display text-2xl font-semibold">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              </FadeUpSection>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative 1: Philosophy */}
      <NarrativeSection
        eyebrow="The Philosophy"
        title="We built Verdara around the forest, not in spite of it."
        body="When we first walked this land in 2016, we found a 12-acre stretch of rainforest tumbling down to a private cove. Most developers would have cleared it. We did the opposite: we surveyed every mature tree, every natural spring, every bird species — and designed the resort around them. The villas sit between the trees, not on top of them. The spa pavilions are open to the canopy. The restaurant's view is the forest itself."
        image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80"
        imageAlt="Verdara villa nestled in rainforest"
        reverse={false}
      />

      {/* Narrative 2: Sustainability */}
      <NarrativeSection
        eyebrow="The Practice"
        title="Sustainability is not a department. It is the operating system."
        body="Verdara runs on solar power generated on-site. Rainwater is harvested, filtered, and reused across the gardens. We compost all organic waste and partner with local farmers for everything we cannot grow ourselves. Our spa products are made from native botanicals, hand-harvested by the same community that has tended this land for generations. There are no single-use plastics at Verdara. There never have been."
        image="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80"
        imageAlt="Spa pavilion in the forest"
        reverse
      />

      {/* Narrative 3: Location */}
      <NarrativeSection
        eyebrow="The Location"
        title="Where the rainforest meets the West Philippine Sea."
        body="Verdara sits on a quiet stretch of coastline in San Juan, Batangas — a three-hour drive from Manila, or a 20-minute helicopter transfer. The resort is bordered by protected rainforest to the east and a crescent of white-sand beach to the west. Sunrises come up over the canopy. Sunsets dissolve into the sea. And in between, there is a great deal of wonderful, productive nothing."
        image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
        imageAlt="Verdara coastline at sunset"
        reverse={false}
      />

      {/* Narrative 4: Team */}
      <NarrativeSection
        eyebrow="The People"
        title="A family — by blood and by choice."
        body="Verdara is led by the Reyes family, who have called Batangas home for five generations. Our team of 84 — from butlers to botanists, chefs to canoe guides — is almost entirely local. We invest deeply in our people: above-market wages, continued education, and a profit-sharing model that ensures every team member has a stake in our success. When you arrive, you are greeted by name. When you leave, you are missed."
        image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80"
        imageAlt="Verdara lounge"
        reverse
      />

      {/* Values */}
      <section className="bg-section py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              What we stand for
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Our Values
            </h2>
          </FadeUpSection>

          <div className="grid gap-6 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <FadeUpSection key={v.title} delay={i * 0.06}>
                <Card className="flex h-full gap-4 rounded-2xl border-border/60 p-6 shadow-luxury">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {v.icon}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {v.description}
                    </p>
                  </div>
                </Card>
              </FadeUpSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#0F2E22] py-20 text-white sm:py-24">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative z-10 text-center">
          <FadeUpSection>
            <Heart className="mx-auto h-8 w-8 text-emerald-300" />
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Come and stay a while.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              The forest is waiting. The cove is calm. The kettle is on. We would love to welcome you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate("book")}
                size="lg"
                className="rounded-full bg-white px-7 text-primary hover:bg-white/90"
              >
                <Waves className="h-4 w-4" />
                Book your stay
              </Button>
              <Button
                onClick={() => navigate("contact")}
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/15"
              >
                Ask a question
              </Button>
            </div>
          </FadeUpSection>
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
    <section className="py-16 sm:py-20">
      <div className="container-luxury">
        <div
          className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
            reverse ? "lg:[direction:rtl]" : ""
          }`}
        >
          <FadeUpSection className={reverse ? "lg:[direction:ltr]" : ""}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-luxury-lg">
              { }
              <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
            </div>
          </FadeUpSection>
          <FadeUpSection delay={0.1} className={reverse ? "lg:[direction:ltr]" : ""}>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              {eyebrow}
            </p>
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
