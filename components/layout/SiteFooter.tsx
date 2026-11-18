"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Leaf, Send } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/ui/SocialIcons";
import { ArrowLogo } from "@/components/ui/ArrowLogo";
import { useStore } from "@/components/providers/StoreProvider";
import { BUSINESS_INFO } from "@/lib/constants";

export function SiteFooter() {
  const { notify } = useStore();
  const [email, setEmail] = useState("");

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      notify({
        type: "error",
        title: "Enter a valid email",
        message: "Please enter a valid email address to subscribe.",
      });
      return;
    }
    notify({
      type: "success",
      title: "Subscribed to Arrow Ventures",
      message: `${email} added for new model launches and offers.`,
    });
    setEmail("");
  };

  return (
    <footer className="bg-[#0B0B0D] text-neutral-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-white/10">
          {/* Brand */}
          <div className="space-y-4">
            <ArrowLogo variant="light" />
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
              Ride Smarter. Live Greener.
            </p>
            <div className="text-xs text-neutral-400 space-y-1">
              <p>{BUSINESS_INFO.address}</p>
              <p>Tel / WhatsApp: {BUSINESS_INFO.whatsapp}</p>
              <p>{BUSINESS_INFO.supportEmail}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?has_3d_model=true"
                  className="hover:text-white transition-colors"
                >
                  3D Interactive Cycles
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Policies */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link
                  href="/contact#faqs"
                  className="hover:text-white transition-colors"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/shipping"
                  className="hover:text-white transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/returns"
                  className="hover:text-white transition-colors"
                >
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Stay Connected
            </h3>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Subscribe to our newsletter for the latest e-bike launches and exclusive offers.
            </p>
            <form onSubmit={handleNewsletter} className="flex items-center">
              <label htmlFor="footer-newsletter" className="sr-only">
                Your Email Address
              </label>
              <input
                id="footer-newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email Address"
                className="flex-1 min-w-0 rounded-l-lg bg-white/10 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="inline-flex h-[34px] w-9 items-center justify-center rounded-r-lg bg-white text-[#0B0B0D] hover:bg-neutral-200 transition-colors shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-neutral-300 hover:bg-white hover:text-[#0B0B0D] transition-colors"
              >
                <FacebookIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-neutral-300 hover:bg-white hover:text-[#0B0B0D] transition-colors"
              >
                <YoutubeIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-neutral-300 hover:bg-white hover:text-[#0B0B0D] transition-colors"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <p>© 2026 Arrow Ventures (Pvt) Ltd. All Rights Reserved.</p>
          <p className="inline-flex items-center gap-1.5 text-neutral-400">
            Riding Towards a Greener Tomorrow
            <Leaf className="h-3.5 w-3.5 text-emerald-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
