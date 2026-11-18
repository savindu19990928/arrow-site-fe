import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  Gem,
  Headphones,
  Leaf,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ArrowMark } from "@/components/ui/ArrowLogo";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Driving a greener, smarter and more connected Sri Lanka through premium electric cycles, batteries, and spare parts.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Diagonal Dark Hero Banner matching Arrow Ventures About Us Page.png */}
      <section className="relative bg-[#0B0B0D] text-white overflow-hidden">
        <div className="relative min-h-[300px] sm:min-h-[360px] flex items-center">
          <img
            src="/images/about-hero-rider.png"
            alt="Sri Lankan cyclist riding an Arrow Ventures electric mountain bike at golden hour"
            className="absolute inset-y-0 right-0 h-full w-full sm:w-2/3 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/85 to-transparent sm:via-[#0B0B0D]/70" />
          <div className="hidden md:block absolute inset-y-0 left-0 w-[46%] bg-[#0B0B0D] hero-slash-left pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 py-12">
            <nav aria-label="Breadcrumb" className="text-xs text-neutral-400 flex items-center gap-2 mb-4">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <span>›</span>
              <span className="text-white font-medium">About Us</span>
            </nav>

            <h1 className="font-display-italic text-5xl sm:text-6xl leading-none">
              <span className="text-white">About </span>
              <span className="text-neutral-300">Us</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-neutral-200 max-w-sm leading-relaxed">
              Driving a greener, smarter and more connected Sri Lanka.
            </p>
            <div className="mt-5 h-0.5 w-16 bg-white/80" />
          </div>
        </div>
      </section>

      {/* 2. Our Story Asymmetric Split */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="overflow-hidden rounded-2xl bg-[#EAECEF] shadow-md story-photo-slash">
              <img
                src="/images/about-story.png"
                alt="Arrow Ventures electric mountain bicycle against modern city skyline"
                className="w-full h-[270px] sm:h-[330px] object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                OUR STORY
              </span>
              <span className="h-px w-12 bg-neutral-300" />
            </div>

            <h2 className="font-display-italic text-4xl text-[#0B0B0D]">
              Arrow Ventures
            </h2>

            <p className="font-display-italic text-lg text-[#0B0B0D]">
              More than just a ride — a better way forward.
            </p>

            <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
              Arrow Ventures was founded with a simple vision: to make clean,
              efficient, and enjoyable electric transportation accessible to
              riders across Sri Lanka — from bustling Colombo daily commutes to
              challenging central highland climbs.
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
              We believe in the power of electric cycles to build a greener
              future, reduce transport carbon footprint, and bring riders closer
              to a healthier, cost-effective lifestyle backed by genuine spare
              parts and local service support.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Mission / Vision / Values Card */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-14">
        <div className="rounded-3xl bg-[#F4F5F7] border border-neutral-200/80 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-300/70">
          <div className="p-8 text-center flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B0D] text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl text-[#0B0B0D] mb-2">
              Our Mission
            </h3>
            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed max-w-xs">
              To provide high-quality electric cycles, batteries, and spare parts
              while promoting sustainable and eco-friendly mobility across Sri
              Lanka.
            </p>
          </div>

          <div className="p-8 text-center flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B0D] text-white">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl text-[#0B0B0D] mb-2">
              Our Vision
            </h3>
            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed max-w-xs">
              To become the most trusted and innovative e-mobility brand in Sri
              Lanka, driving a cleaner, smarter tomorrow.
            </p>
          </div>

          <div className="p-8 text-center flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B0D] text-white">
              <Gem className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl text-[#0B0B0D] mb-2">
              Our Values
            </h3>
            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed max-w-xs">
              Innovation • Quality • Sustainability
              <br />
              Customer First • Integrity
            </p>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                WHY CHOOSE US
              </span>
              <span className="h-px w-12 bg-neutral-300" />
            </div>

            <h2 className="font-display-italic text-4xl sm:text-5xl text-[#0B0B0D] leading-[0.98]">
              Your Trusted E-Cycle Partner
            </h2>

            <p className="text-sm text-neutral-600 leading-relaxed">
              At Arrow Ventures, we are committed to delivering more than just
              products. We provide a complete e-mobility experience with
              interactive 3D inspection, genuine components, and dedicated care.
            </p>

            <ul className="space-y-2.5 pt-1">
              {[
                "Premium Quality Electric Cycles & Parts",
                "Reliable After-Sales & Warranty Support",
                "Expert Advice & Compatibility Guidance",
                "Islandwide Delivery (Free Rs. 100,000+)",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#0B0B0D]"
                >
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B0B0D] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
              >
                Shop with Confidence
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Quality Assurance",
                desc: "Ride with confidence knowing every bike and part is vetted.",
              },
              {
                icon: Headphones,
                title: "Dedicated Support",
                desc: "Our Colombo technical team is always here to assist you.",
              },
              {
                icon: Truck,
                title: "Fast Islandwide Delivery",
                desc: "Get your ride delivered safely anywhere across Sri Lanka.",
              },
              {
                icon: Leaf,
                title: "Eco-Friendly Choice",
                desc: "Zero tailpipe emissions for a cleaner, greener island.",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 p-6 text-center flex flex-col items-center"
                >
                  <Icon className="h-8 w-8 text-[#0B0B0D] mb-3" />
                  <h3 className="font-display text-lg text-[#0B0B0D]">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600 leading-relaxed max-w-[210px]">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Bottom Join CTA Banner */}
      <section className="relative bg-[#0B0B0D] text-white overflow-hidden">
        <div className="relative min-h-[210px] flex items-center">
          <img
            src="/images/about-cta-rider.png"
            alt="Sri Lankan electric bicycle rider on mountain road"
            className="absolute inset-y-0 left-0 h-full w-full sm:w-1/2 object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-[#0B0B0D]/85 to-[#0B0B0D]" />

          <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="md:ml-auto md:w-1/2 space-y-3 text-center md:text-left">
              <h2 className="font-display-italic text-3xl sm:text-4xl text-white">
                Join the Arrow Ventures Family
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300">
                Let&apos;s ride towards a cleaner, greener, and brighter future
                across Sri Lanka together.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-[#0B0B0D] hover:bg-neutral-200 transition-colors"
              >
                Explore Our Products
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="hidden lg:block opacity-20">
              <ArrowMark className="h-20 w-20" color="#FFFFFF" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
