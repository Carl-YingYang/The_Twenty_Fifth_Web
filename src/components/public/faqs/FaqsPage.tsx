"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { HelpCircle, Mail, Phone, Calendar, CreditCard, PawPrint, Baby, Wifi, Plane } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useViewStore } from "@/store/useViewStore";
import { FadeUpSection } from "../shared";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: Faq[] = [
  {
    id: "checkin",
    category: "Arrival & Departure",
    question: "What time is check-in and check-out?",
    answer:
      "Check-in is from 3:00 PM onward, and check-out is by 11:00 AM. Early check-in and late check-out are subject to availability — please request these in advance through your reservation or by contacting our concierge. We will always do our best to accommodate your travel schedule.",
  },
  {
    id: "booking",
    category: "Booking Process",
    question: "How do I make a reservation at Verdara?",
    answer:
      "You can book directly through our website using the booking flow — simply select your dates, choose your villa, and complete the guest details form. You'll receive an instant confirmation email with your reference number. Alternatively, you may call our reservations team at +63 (2) 8888 4400 or email stay@verdararesort.com.",
  },
  {
    id: "payment",
    category: "Payment",
    question: "When and how do I pay for my stay?",
    answer:
      "A reservation made through our website is held as Pending until confirmed by our team. Once confirmed, a 30% deposit is required to secure the booking, with the balance due 14 days before arrival. We accept major credit cards, bank transfer, and selected digital wallets. Payment details are sent in your confirmation email.",
  },
  {
    id: "cancellation",
    category: "Cancellation Policy",
    question: "What is your cancellation policy?",
    answer:
      "Cancellations made 14 or more days before arrival receive a full refund of any deposit paid. Cancellations 7–13 days before arrival receive a 50% refund. Cancellations within 7 days of arrival are non-refundable. We are happy to reschedule your stay to a later date (within 12 months) at no charge, subject to availability.",
  },
  {
    id: "transfer",
    category: "Arrival & Departure",
    question: "Do you offer airport transfers?",
    answer:
      "Yes. We offer private car transfers from Ninoy Aquino International Airport (Manila) — approximately 3 hours — or helicopter transfers (20 minutes) for an additional fee. Please share your flight details with our concierge at least 48 hours before arrival, and we will arrange everything for you.",
  },
  {
    id: "children",
    category: "Families",
    question: "Are children welcome at Verdara?",
    answer:
      "Absolutely. Children of all ages are welcome. We offer family-friendly villas (Garden and Pool Villas sleep up to 4 guests), complimentary cribs and rollaway beds on request, a kids' menu at our restaurant, and a supervised nature club for children aged 4–12. Babysitting services are available with 24 hours' notice.",
  },
  {
    id: "pets",
    category: "Families",
    question: "Can I bring my pet?",
    answer:
      "We are a pet-friendly resort for well-behaved dogs up to 15kg. A pet fee of ₱1,500 per night applies, and pets must remain on a leash in public areas. Please let us know in advance so we can prepare a pet welcome basket and assign a ground-floor villa. Unfortunately, we cannot accommodate cats or other animals at this time.",
  },
  {
    id: "wifi",
    category: "In-Residence",
    question: "Is Wi-Fi available throughout the resort?",
    answer:
      "Yes — complimentary high-speed fiber Wi-Fi is available in all villas, restaurants, and common areas. We have also installed Wi-Fi extenders along the beach and at the spa pavilion, so you can stay connected wherever you wander. That said, we hope you'll be tempted to disconnect.",
  },
  {
    id: "dining",
    category: "Dining",
    question: "What dining options are available?",
    answer:
      "Verdara offers two main venues: The Farm (our farm-to-table fine dining restaurant, open for breakfast, lunch, and dinner) and The Beach Bar (sunset cocktails, light bites, and all-day coffee). In-villa dining is available 24 hours. A tropical breakfast is included in every stay. Special dietary requirements — vegan, gluten-free, halal, kosher — are happily accommodated with prior notice.",
  },
  {
    id: "spa",
    category: "Wellness",
    question: "Do I need to book spa treatments in advance?",
    answer:
      "We strongly recommend booking spa treatments in advance, especially during peak season (December–April) and weekends. Our Forest Spa has just six open-air pavilions, and these tend to fill quickly. You can add treatments to your reservation at the time of booking, or email spa@verdararesort.com up to 7 days before arrival.",
  },
];

const CATEGORIES = ["All", "Booking Process", "Arrival & Departure", "Payment", "Cancellation Policy", "Families", "In-Residence", "Dining", "Wellness"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Booking Process": <Calendar className="h-3.5 w-3.5" />,
  "Arrival & Departure": <Plane className="h-3.5 w-3.5" />,
  "Payment": <CreditCard className="h-3.5 w-3.5" />,
  "Cancellation Policy": <HelpCircle className="h-3.5 w-3.5" />,
  "Families": <Baby className="h-3.5 w-3.5" />,
  "In-Residence": <Wifi className="h-3.5 w-3.5" />,
  "Dining": <PawPrint className="h-3.5 w-3.5" />,
  "Wellness": <HelpCircle className="h-3.5 w-3.5" />,
};

export function FaqsPage() {
  const navigate = useViewStore((s) => s.navigate);
  const [activeCategory, setActiveCategory] = React.useState("All");

  const filteredFaqs = React.useMemo(() => {
    if (activeCategory === "All") return FAQS;
    return FAQS.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-section py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative">
          <FadeUpSection className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Frequently Asked
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Good to know before you arrive
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything from check-in times to cancellation policy, pets to pillow menus. Can't
              find your answer? Our concierge is one message away.
            </p>
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
            {/* Category nav */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Categories
              </h2>
              <nav className="flex flex-wrap gap-2 lg:flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-3 py-2 text-left text-sm transition-colors ${
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Accordion */}
            <div>
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-8">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border-b border-border/60 last:border-b-0"
                      >
                        <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                          <span className="flex items-start gap-3">
                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {CATEGORY_ICONS[faq.category] ?? <HelpCircle className="h-3.5 w-3.5" />}
                            </span>
                            <span>{faq.question}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pl-9 text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>

                {/* Still have questions CTA */}
                <Card className="mt-6 rounded-2xl border-dashed bg-section p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Still have a question? Our concierge would love to help.
                  </p>
                  <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button onClick={() => navigate("contact")} className="rounded-full">
                      <Mail className="h-4 w-4" />
                      Contact concierge
                    </Button>
                    <a href="tel:+63288884400">
                      <Button variant="outline" className="w-full rounded-full sm:w-auto">
                        <Phone className="h-4 w-4" />
                        +63 (2) 8888 4400
                      </Button>
                    </a>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
