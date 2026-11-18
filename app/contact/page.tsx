"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { BUSINESS_INFO, formatLKR, FREE_DELIVERY_THRESHOLD_LKR, STANDARD_DELIVERY_FEE_LKR } from "@/lib/constants";
import { useStore } from "@/components/providers/StoreProvider";

export default function ContactPage() {
  const { notify } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Product & Compatibility Advice");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify({
      type: "success",
      title: "Inquiry received",
      message: `Thanks ${name}! Our Colombo team will respond via email or WhatsApp shortly.`,
    });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 sm:py-14 space-y-14">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          SUPPORT & SHOWROOM
        </p>
        <h1 className="font-display-italic text-4xl sm:text-5xl text-[#0B0B0D] mt-1">
          Contact Arrow Ventures
        </h1>
        <p className="mt-2.5 text-sm text-neutral-600 leading-relaxed">
          Have questions about e-bike range, spare-part compatibility, Koko /
          Mintpay installments, or an existing bank transfer? Our Sri Lankan
          support team is ready to help.
        </p>
      </div>

      {/* Contact Cards + Inquiry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          {[
            {
              icon: MapPin,
              title: "Flagship Showroom & Service Centre",
              detail: BUSINESS_INFO.address,
            },
            {
              icon: Phone,
              title: "Telephone",
              detail: BUSINESS_INFO.phone,
            },
            {
              icon: MessageCircle,
              title: "WhatsApp Support",
              detail: BUSINESS_INFO.whatsapp,
            },
            {
              icon: Mail,
              title: "Email Support",
              detail: BUSINESS_INFO.supportEmail,
            },
            {
              icon: Clock,
              title: "Operating Hours",
              detail: BUSINESS_INFO.serviceHours,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-4 flex items-start gap-3.5"
              >
                <div className="h-9 w-9 rounded-full bg-[#0B0B0D] text-white flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#0B0B0D]">
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 mt-0.5">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm"
        >
          <h2 className="font-display text-2xl text-[#0B0B0D]">
            Send Us a Message
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Your Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kasun Perera"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasun@example.com"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
            >
              <option>Product & Compatibility Advice</option>
              <option>Order Status / Bank Transfer Slip</option>
              <option>Warranty & Service Inquiry</option>
              <option>Book a Showroom Test Ride</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Message / Bike Model & Question *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include your order number or bicycle model if asking about parts compatibility..."
              className="w-full rounded-xl border border-neutral-300 p-3.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800"
          >
            <Send className="h-3.5 w-3.5" />
            Send Message
          </button>
        </form>
      </div>

      {/* FAQs Section */}
      <section id="faqs" className="pt-8 border-t border-neutral-200 space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            HELP CENTER
          </p>
          <h2 className="font-display text-3xl text-[#0B0B0D] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              q: "How much does islandwide delivery cost?",
              a: `Orders of ${formatLKR(FREE_DELIVERY_THRESHOLD_LKR)} or more qualify for Free Islandwide Delivery. Orders under that threshold have a flat ${formatLKR(STANDARD_DELIVERY_FEE_LKR)} delivery fee.`,
            },
            {
              q: "What payment options are available?",
              a: "You can pay via Direct Bank Transfer (Commercial Bank of Ceylon with receipt upload), Koko Buy Now Pay Later, or Mintpay 3 interest-free installments.",
            },
            {
              q: "Why does my Bank Transfer order say PENDING?",
              a: "All bank transfer orders stay in PENDING verification status until you upload your deposit slip / receipt and our team confirms the credit against our bank statement.",
            },
            {
              q: "Can I check out without creating an account?",
              a: "Yes! Guest checkout is fully supported. You can track your order, upload a bank slip, and download your official PDF invoice anytime on our Track Order page.",
            },
            {
              q: "Can I view products in 3D and AR?",
              a: "Yes, supported e-bikes feature an interactive 3D viewer with 360° drag rotation, zoom, camera reset, and mobile AR placement.",
            },
            {
              q: "How do returns, exchanges, or warranty claims work?",
              a: "You can request cancellations or returns directly from your Customer Portal, or contact our team with your order number and photos.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-5"
            >
              <h3 className="text-sm font-bold text-[#0B0B0D]">{item.q}</h3>
              <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap gap-3 text-xs">
          <Link href="/policies/shipping" className="font-bold underline">
            Shipping Policy
          </Link>
          <Link href="/policies/returns" className="font-bold underline">
            Return & Refund Policy
          </Link>
          <Link href="/policies/privacy" className="font-bold underline">
            Privacy Policy
          </Link>
          <Link href="/policies/terms" className="font-bold underline">
            Terms & Conditions
          </Link>
        </div>
      </section>
    </div>
  );
}
