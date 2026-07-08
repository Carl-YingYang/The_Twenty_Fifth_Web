"use client";

import * as React from "react";
import { HelpCircle, MessageSquare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useViewStore } from "@/store/useViewStore";
import { RESORT_INFO } from "@/lib/constants";
import { FadeUpSection, SectionHeading } from "../shared";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: Faq[] = [
  // Booking & Payment
  {
    id: "how-book",
    category: "Booking & Payment",
    question: "How do I book?",
    answer:
      "Pick your dates on the homepage or on The Villa page, choose the whole villa or a single bedroom, and fill in your details. When you submit, you'll get a reference number (something like TTF-2026-123456). No payment is needed at this stage — we'll reach out by phone or Messenger to confirm.",
  },
  {
    id: "after-book",
    category: "Booking & Payment",
    question: "What happens after I request a booking?",
    answer:
      "We review your request and confirm availability, usually within a few hours (and always within 24 hours). Once we've confirmed, we'll arrange a deposit to lock in your dates. You'll see the status update if you search for your booking with the reference number and your email.",
  },
  {
    id: "cancellation",
    category: "Booking & Payment",
    question: "What's the cancellation policy?",
    answer:
      "If your plans change, just message us. We're flexible — we'd rather reschedule your stay than lose you. Full refunds are available for cancellations made 14 days or more before check-in. For cancellations within 7 days, we'll work with you on a case-by-case basis.",
  },
  {
    id: "payment",
    category: "Booking & Payment",
    question: "How do I pay?",
    answer:
      "Once your dates are confirmed, we'll send payment details by Messenger, SMS, or email. We accept bank transfer, GCash, and major credit cards. The balance is due on or before arrival.",
  },

  // The Villa
  {
    id: "check-in",
    category: "The Villa",
    question: "When is check-in and check-out?",
    answer: `Check-in is from 2:00 PM onwards, and check-out is by 12:00 noon. If you need early check-in or late check-out, just ask — we'll always do our best to accommodate your travel schedule, subject to availability.`,
  },
  {
    id: "extra-guests",
    category: "The Villa",
    question: "Can I bring extra guests?",
    answer:
      "The whole villa comfortably sleeps up to 25 guests. If you're booking a single bedroom, the capacity is shown on the room card (usually 2–4 guests). For day visitors or extra sleeping arrangements, please message us in advance so we can prepare.",
  },
  {
    id: "meals",
    category: "The Villa",
    question: "Are meals included?",
    answer:
      "Meals are not included, but the villa has a fully equipped kitchen with cookware, dinnerware, and a full-size fridge. There's also an outdoor BBQ and grill area. Many guests bring their own food, or we can recommend local caterers — just ask when you book.",
  },
  {
    id: "private-beach",
    category: "The Villa",
    question: "Is the beach private?",
    answer:
      "Yes — The Twenty-Fifth has direct access to a private stretch of Botolan coastline. Beach loungers and umbrellas are set up for guests. The water is calm and swimmable year-round, and the sunsets are spectacular.",
  },
  {
    id: "wifi",
    category: "The Villa",
    question: "Is there WiFi?",
    answer:
      "Yes — the villa has fast, reliable WiFi throughout. It's more than enough for video calls, streaming, and staying connected. That said, we encourage you to put the phone down and enjoy the beach.",
  },
  {
    id: "safety",
    category: "The Villa",
    question: "Is the villa safe for children?",
    answer:
      "Absolutely. The pool area has a safety fence, and the beach entry is gentle and shallow. We provide life vests for kids on request. Our caretaker is also on-site if you need any assistance.",
  },
  {
    id: "quiet-hours",
    category: "The Villa",
    question: "Are there quiet hours?",
    answer:
      "We ask guests to keep noise down after 10 PM out of respect for the nearby community and fellow guests. Daytime is all yours — play music, celebrate, enjoy the beach. We just ask for a peaceful evening wind-down.",
  },

  // Getting There
  {
    id: "from-manila",
    category: "Getting There",
    question: "How do I get there from Manila?",
    answer:
      "The drive from Manila to Botolan, Zambales is about 3 to 4 hours via NLEX and SCTEX. The most direct route takes you through Subic-Clark-Tarlac Expressway, exiting at Subic and following the coast north. Once you book, we'll send detailed driving directions and pin location.",
  },
  {
    id: "parking",
    category: "Getting There",
    question: "Is there parking?",
    answer:
      "Yes — free on-site parking is available for all guests. There's space for several vehicles, so no need to carpool unless you want to.",
  },
  {
    id: "pets",
    category: "Getting There",
    question: "Is it pet-friendly?",
    answer:
      "We're pet-friendly on request. Please let us know in advance if you'd like to bring a pet so we can prepare — a small cleaning fee may apply for larger dogs. Please message us first.",
  },

  // House Rules
  {
    id: "events",
    category: "House Rules",
    question: "Can I host an event?",
    answer:
      "Absolutely — The Twenty-Fifth was built for celebrations. Birthdays, family reunions, intimate weddings, barkada getaways are all welcome. We can help arrange decor and setup. Please mention the event when you book so we can plan accordingly.",
  },
  {
    id: "contact-host",
    category: "House Rules",
    question: "How do I contact the host?",
    answer: `The easiest way to reach us is by phone or Messenger. Call or text ${RESORT_INFO.phone}, or message us on Messenger via our Facebook page (facebook.com/the25thinzambales). Our caretaker is also on-site during your stay if you need anything in person.`,
  },
  {
    id: "smoking",
    category: "House Rules",
    question: "Is smoking allowed?",
    answer:
      "Smoking is permitted in outdoor areas only — the deck, garden, and beach. No smoking inside the villa, please. Ashtrays are provided on the outdoor terraces.",
  },
  {
    id: "damages",
    category: "House Rules",
    question: "What if something gets damaged?",
    answer:
      "Accidents happen, especially with groups. Just let us know right away so we can assess and arrange repairs. We ask guests to treat the villa as they would their own home. Significant damage beyond normal wear may incur a charge, but we always discuss it with you first.",
  },
];

const CATEGORIES = [
  "Booking & Payment",
  "The Villa",
  "Getting There",
  "House Rules",
] as const;

export function FaqsPage() {
  const navigate = useViewStore((s) => s.navigate);

  return (
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="FAQs"
              title="Frequently asked questions"
              subtitle="Everything you need before you arrive — booking, check-in, getting here, and the small print. Still have a question? We're a message away."
            />
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="mx-auto max-w-3xl">
            {CATEGORIES.map((cat, idx) => {
              const items = FAQS.filter((f) => f.category === cat);
              return (
                <FadeUpSection key={cat} delay={idx * 0.05} className="mb-10">
                  <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
                    {cat}
                  </h2>
                  <Card className="overflow-hidden rounded-xl border border-border bg-card p-2 shadow-card">
                    <Accordion type="single" collapsible className="w-full">
                      {items.map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className="border-b border-border last:border-b-0"
                        >
                          <AccordionTrigger className="px-4 text-left text-base font-medium hover:no-underline">
                            <span className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </span>
                              <span>{faq.question}</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pl-12 text-sm leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Card>
                </FadeUpSection>
              );
            })}

            {/* Bottom CTA */}
            <FadeUpSection>
              <Card className="rounded-xl border-dashed border-border bg-section p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Still have questions? Message us on Messenger and
                  we&rsquo;ll get back to you quickly.
                </p>
                <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href={RESORT_INFO.social.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full rounded-full sm:w-auto">
                      <MessageSquare className="h-4 w-4" />
                      Message us on Messenger
                    </Button>
                  </a>
                  <Button
                    onClick={() => navigate("contact")}
                    variant="outline"
                    className="w-full rounded-full sm:w-auto"
                  >
                    Contact Page
                  </Button>
                </div>
              </Card>
            </FadeUpSection>
          </div>
        </div>
      </section>
    </div>
  );
}
