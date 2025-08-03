"use client";

import { Button } from "@/components/ui/button";
import { Sparkle } from "lucide-react";
import { TypingAnimation } from "@/components/typing-animation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";

export function HeroSection() {
  return (
    <motion.div
      className="relative z-10 flex w-full max-w-4xl flex-col items-center space-y-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Logo with enhanced animations */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          duration: 1.2,
          delay: 0.2,
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
      >
        <div className="flex h-24 w-24 items-center justify-center">
          <Image
            src="/logo.svg"
            alt="Eve Logo"
            width={80}
            height={80}
            className="drop-shadow-sm"
          />
        </div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Main Heading with enhanced content */}
      <motion.div
        className="space-y-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="space-y-2">
          <TypingAnimation />
          <motion.p
            className="text-foreground/80 sm:text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            with Adam.
          </motion.p>
        </div>

        <motion.p
          className="mx-auto max-w-2xl text-lg text-foreground/70 md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          Adam helps you find your voice. We analyze the emotions in your speech and offer real-time solutions to help you turn nervousness into confidence, so you can connect with others more authentically and confidently.
        </motion.p>
      </motion.div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-sky-600 to-primary p-[2px] shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="relative rounded-2xl bg-gradient-to-r from-primary via-sky-600 to-primary px-8 py-4 text-white transition-all duration-300 group-hover:from-primary/90 group-hover:via-sky-600/90 group-hover:to-primary/90">
            <Link href="/Recorder"
            className="relative z-10 text-lg font-semibold">
              Get Started for Free
            </Link>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </div>

      {/* Trust indicators */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.0 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Emotionally Intelligent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Privacy first</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span>Community driven</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
