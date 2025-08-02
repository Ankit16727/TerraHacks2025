"use client";

import { motion } from "motion/react";
import { Smartphone } from "lucide-react";
import Image from "next/image";

export function PhoneShowcase() {
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
          See Eve in Action
        </motion.h2>
        <motion.p
          className="mx-auto max-w-2xl text-lg text-foreground/70"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Experience the intuitive interface designed for those moments when you
          need to feel connected and safe.
        </motion.p>
      </motion.div>

      {/* Phone mockup container - with real screenshot */}
      <div className="flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Phone frame */}
          <div className="relative h-[640px] w-80 rounded-[3rem] bg-gradient-to-br from-gray-800 to-gray-900 p-2 shadow-2xl">
            {/* Screen area with actual screenshot */}
            <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border border-gray-300/20">
              <Image
                src="/dashboard-screenshot.webp"
                alt="Eve Dashboard Screenshot"
                fill
                className="pointer-events-none object-cover object-top select-none"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>

            {/* Phone details */}
            <div className="absolute top-6 left-1/2 h-1 w-16 -translate-x-1/2 transform rounded-full bg-gray-600" />
            <div className="absolute bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 transform rounded-full bg-gray-600" />
          </div>

          {/* Simplified decorative elements */}
          <div className="absolute -top-4 -left-4 h-6 w-6 rounded-full bg-primary/10" />
          <div className="absolute -right-4 -bottom-4 h-4 w-4 rounded-full bg-purple-500/10" />
        </motion.div>
      </div>

      {/* Call to action */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
      >
        <p className="text-sm text-foreground/60">
          Ready to experience campus safety reimagined? Join the Eve community
          today.
        </p>
      </motion.div>
    </section>
  );
}
