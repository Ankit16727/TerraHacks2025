"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function BackgroundElements() {
  // Generate random particle positions and transitions only on the client
  const [particles, setParticles] = useState<
    { left: number; top: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    const generated = Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 8 + Math.random() * 4,
      delay: Math.random() * 5,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Animated Lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Diagonal flowing lines */}
        <motion.path
          d="M0,20 Q25,15 50,25 T100,20"
          stroke="rgba(0, 132, 209, 0.1)"
          strokeWidth="0.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,40 Q30,35 60,45 T100,40"
          stroke="rgba(0, 132, 209, 0.08)"
          strokeWidth="0.3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, delay: 1, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,70 Q40,65 70,75 T100,70"
          stroke="rgba(0, 132, 209, 0.06)"
          strokeWidth="0.4"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 5, delay: 1.5, ease: "easeInOut" }}
        />

        {/* Vertical flowing lines */}
        <motion.path
          d="M15,0 Q20,25 15,50 T15,100"
          stroke="rgba(0, 132, 209, 0.05)"
          strokeWidth="0.3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 6, delay: 2, ease: "easeInOut" }}
        />
        <motion.path
          d="M85,0 Q80,30 85,60 T85,100"
          stroke="rgba(0, 132, 209, 0.04)"
          strokeWidth="0.2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 7, delay: 2.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Floating Dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/20"
          style={{
            left: `${15 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 4,
            delay: i * 0.3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Subtle Grid Pattern */}
      <motion.div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(81, 162, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(81, 162, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.02 }}
        transition={{ duration: 2, delay: 3 }}
      />

      {/* Subtle particle effects */}
      {particles.map((pos, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute h-0.5 w-0.5 rounded-full bg-primary/30"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: pos.duration,
            delay: pos.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}