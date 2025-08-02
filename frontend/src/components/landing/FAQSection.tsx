"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Eve protect my privacy?",
    answer:
      "Your privacy is our top priority. Location data is only shared with friends you explicitly choose, and all data is encrypted in transit. You have complete control over who can see your location and when. We automatically delete location history after 30 days and never sell your data to third parties.",
  },
  {
    question: "What happens if my phone dies during a walk?",
    answer:
      "Eve is designed with this scenario in mind. Before your battery gets critically low, the app will automatically notify your selected buddy about your last known location and estimated arrival time. We also recommend sharing your planned route beforehand as an extra safety measure.",
  },
  {
    question: "Can I use Eve without sharing my location?",
    answer:
      "While location sharing is core to Eve's safety features, you can still use the Community Glow Map to discover safe routes and contribute to the community by adding pins about well-lit areas or concerns. However, the buddy tracking and AI Guardian features require location access to work effectively.",
  },
  {
    question: "How does the AI Guardian work?",
    answer:
      "The AI Guardian monitors your movement patterns during a guided walk. If you stop moving for an extended period or deviate significantly from your planned route, it will send you a gentle check-in notification. If you don't respond within a reasonable time, it alerts your chosen buddy with your last known location.",
  },
  {
    question: "Is Eve free to use?",
    answer:
      "Yes! Eve's core safety features are completely free for all students. This includes buddy tracking, the AI Guardian, community map access, and emergency alerts. We believe campus safety should be accessible to everyone in the community.",
  },
  {
    question: "What if I don't have friends on campus yet?",
    answer:
      "Eve is perfect for building those connections! You can start by using the Community Glow Map to find safe routes. As you meet people in classes or activities, you can gradually build your buddy network. The app also helps you discover study groups and campus events where you can meet like-minded people.",
  },
];

export function FAQSection() {
  return (
    <section className="w-full max-w-4xl px-6 py-16">
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.p
          className="mx-auto max-w-2xl text-lg text-foreground/70"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Got questions about how Eve works? We've got answers to help you feel
          confident about joining our community.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card/50 to-primary/5 p-6 backdrop-blur-sm">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="rounded-lg border border-primary/10 bg-card/30 px-4 backdrop-blur-sm transition-all duration-200 hover:bg-card/50 hover:shadow-md"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-foreground/70">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </motion.div>

      {/* Additional help section */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h3 className="mb-2 font-semibold text-foreground">
            Still have questions?
          </h3>
          <p className="text-sm text-foreground/60">
            We're here to help! Reach out to our support team and we'll get back
            to you as soon as possible.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
