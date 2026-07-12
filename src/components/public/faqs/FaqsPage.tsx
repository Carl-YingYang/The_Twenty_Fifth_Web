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
import { FAQS, FAQ_CATEGORIES } from "@/lib/faqs";
import { FadeUpSection, SectionHeading } from "../shared";

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
            {FAQ_CATEGORIES.map((cat, idx) => {
              const items = FAQS.filter((f) => f.category === cat);
              return (
                <FadeUpSection key={cat} delay={idx * 0.05} className="mb-10">
                  <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
                    {cat}
                  </h2>
                  <Card className="overflow-hidden rounded-lg border border-border bg-card p-2 shadow-card">
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
              <Card className="rounded-lg border-dashed border-border bg-section p-6 text-center">
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
                    <Button className="w-full rounded-md sm:w-auto">
                      <MessageSquare className="h-4 w-4" />
                      Message us on Messenger
                    </Button>
                  </a>
                  <Button
                    onClick={() => navigate("contact")}
                    variant="outline"
                    className="w-full rounded-md sm:w-auto"
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
