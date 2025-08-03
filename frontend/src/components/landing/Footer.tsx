"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Shield, Users, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="z-40 w-full border-t border-primary/10 bg-gradient-to-t from-primary/5 to-transparent">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Brand section */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Adam Logo"
                width={32}
                height={32}
                className="drop-shadow-sm"
              />
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Adam
              </h3>
            </div>
            <p className="mb-4 max-w-md text-sm leading-relaxed text-foreground/70">
              Your personal campus beacon. Building safer communities through
              connection, not fear. Every student deserves to feel secure while
              exploring their campus and city.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Heart className="h-3 w-3 text-red-500" />
                <span>Made with care for all</span>
              </div>
            </div>
          </motion.div>

          {/* Features quick links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="mb-4 font-semibold text-foreground">Features</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-center gap-2">
                <Users className="h-3 w-3 text-primary" />
                <span>Buddy System</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" />
                <span>AI Guardian</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-primary" />
                <span>Community Map</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-primary" />
                <span>Emergency Alerts</span>
              </li>
            </ul>
          </motion.div>

          {/* Support links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="mb-4 font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-primary">
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom section */}
        <motion.div
          className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-primary/10 pt-8 md:flex-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-center text-xs text-foreground/60 md:text-left">
            <p>© 2024 Adam. All rights reserved.</p>
            <p className="mt-1">
              Building safer communities, one connection at a time.
            </p>
          </div>

          {/* Call to action */}
          <div>
            <Link
              href="/sign-in"
              className="rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Join the Community
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </footer>
  );
}
