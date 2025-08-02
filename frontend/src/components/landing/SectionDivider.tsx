"use client";

import { motion } from "motion/react";

interface SectionDividerProps {
  variant?: "default" | "wave" | "dots";
}

export function SectionDivider({ variant = "default" }: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div className="relative w-full py-16">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          viewport={{ once: true }}
        >
          <svg
            className="h-8 w-full max-w-4xl"
            viewBox="0 0 800 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M0,16 Q200,4 400,16 T800,16"
              stroke="url(#gradient-wave)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              viewport={{ once: true }}
            />
            <defs>
              <linearGradient
                id="gradient-wave"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgba(147, 51, 234, 0.2)" />
                <stop offset="50%" stopColor="rgba(147, 51, 234, 0.8)" />
                <stop offset="100%" stopColor="rgba(147, 51, 234, 0.2)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className="relative w-full py-16">
        <motion.div
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/40"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  // Default gradient line divider
  return (
    <div className="relative w-full py-16">
      <motion.div
        className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        viewport={{ once: true }}
      />

      {/* Center accent */}
      <motion.div
        className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/50"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
      />
    </div>
  );
}
