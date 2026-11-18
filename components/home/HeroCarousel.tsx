"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Box } from "lucide-react";
import { ArrowMark } from "@/components/ui/ArrowLogo";
import type { ProductListItem, PromotionalCampaign } from "@/lib/types";
import { formatLKR } from "@/lib/constants";

interface HeroCarouselProps {
  campaigns: PromotionalCampaign[];
  featuredProducts: ProductListItem[];
}

interface Slide {
  id: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image: string;
  imageAlt: string;
  badge?: string;
}

export function HeroCarousel({
  campaigns,
  featuredProducts,
}: HeroCarouselProps) {
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [
      {
        id: "flagship-ride",
        eyebrow: "ARROW VENTURES",
        titleLine1: "RIDE THE",
        titleLine2: "FUTURE",
        subtitle:
          "Premium Electric Cycles for a Smarter, Greener Tomorrow across Sri Lanka.",
        ctaLabel: "Shop Electric Cycles",
        ctaHref: "/shop?category=e-bikes",
        secondaryLabel: "View 3D Models",
        secondaryHref: "/shop?has_3d_model=true",
        image: "/images/hero-slide-1.jpg",
        imageAlt: "Arrow Ventures electric mountain bicycle on Sri Lankan twilight mountain road",
      },
    ];

    // Live promotional campaigns from API
    for (const c of campaigns) {
      if (!c.is_active) continue;
      list.push({
        id: `campaign-${c.id}`,
        eyebrow: "SPECIAL CAMPAIGN",
        titleLine1: c.title.split(" ").slice(0, 2).join(" ").toUpperCase(),
        titleLine2:
          c.title.split(" ").slice(2).join(" ").toUpperCase() ||
          `${Math.round(parseFloat(c.discount_percentage || "0"))}% OFF`,
        subtitle:
          c.description ||
          "Limited-time promotional offer across Sri Lanka.",
        ctaLabel: "Explore Offer",
        ctaHref: "/shop?is_featured=true",
        image: c.banner || "/images/hero-slide-2.png",
        imageAlt: c.title,
        badge:
          parseFloat(c.discount_percentage) > 0
            ? `Up to ${Math.round(parseFloat(c.discount_percentage))}% OFF`
            : "Live Offer",
      });
    }

    // Dynamic featured e-bike spotlight slides built from live API catalog
    const ebikeSpotlight = featuredProducts.find(
      (p) => p.has_3d_model && p.category?.slug === "e-bikes"
    );
    if (ebikeSpotlight) {
      list.push({
        id: `spotlight-${ebikeSpotlight.slug}`,
        eyebrow: "SRI LANKA TRAIL EDITION",
        titleLine1: "CONQUER",
        titleLine2: "EVERY HILL",
        subtitle: `${ebikeSpotlight.name} — ${formatLKR(ebikeSpotlight.price)}. Built for Kandy hills & city commutes.`,
        ctaLabel: "Inspect in 3D",
        ctaHref: `/products/${ebikeSpotlight.slug}`,
        secondaryLabel: "Shop All E-Bikes",
        secondaryHref: "/shop?category=e-bikes",
        image: "/images/hero-slide-2.png",
        imageAlt: "Sri Lankan cyclist riding Arrow electric mountain bike on highland pass",
        badge:
          ebikeSpotlight.discount_percentage > 0
            ? `Save ${Math.round(ebikeSpotlight.discount_percentage)}%`
            : "Featured 3D",
      });
    }

    const secondBike = featuredProducts.find(
      (p) => p.id !== ebikeSpotlight?.id && p.category?.slug === "e-bikes"
    );
    if (secondBike) {
      list.push({
        id: `spotlight-${secondBike.slug}`,
        eyebrow: "ISLANDWIDE DELIVERY",
        titleLine1: "BUILT FOR",
        titleLine2: "PERFORMANCE",
        subtitle: `${secondBike.name} — Starting at ${formatLKR(secondBike.price)} with Koko & Mintpay 3x installments.`,
        ctaLabel: "Shop Now",
        ctaHref: `/products/${secondBike.slug}`,
        secondaryLabel: "All Models",
        secondaryHref: "/shop",
        image: "/images/hero-slide-3.png",
        imageAlt: `${secondBike.name} electric mountain bicycle`,
        badge: "Free Delivery 100K+",
      });
    }

    return list;
  }, [campaigns, featuredProducts]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(nextSlide, 6500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length, nextSlide]);

  const current = slides[activeIndex] ?? slides[0];

  return (
    <section
      aria-label="Featured Promotions & Hero Carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative bg-[#0B0B0D] text-white overflow-hidden"
    >
      <div className="relative min-h-[430px] sm:min-h-[490px] lg:min-h-[540px] flex items-center">
        {/* Background Slides */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            aria-hidden={idx !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === activeIndex ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.imageAlt}
              className="h-full w-full object-cover object-center sm:object-right"
            />
            {/* Architectural dark left-to-right gradient & subtle diagonal overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/88 to-transparent sm:via-[#0B0B0D]/70" />
            <div className="hidden lg:block absolute inset-y-0 left-0 w-[48%] bg-[#0B0B0D]/90 hero-slash-left pointer-events-none" />
          </div>
        ))}

        {/* Subtle Arrow Brand Watermark on right */}
        <div className="hidden xl:flex absolute right-8 bottom-12 z-10 flex-col items-center opacity-20 pointer-events-none select-none">
          <ArrowMark className="h-20 w-20" color="#FFFFFF" />
          <span className="font-display-italic text-sm tracking-widest mt-1">
            ARROW VENTURES
          </span>
        </div>

        {/* Hero Copy Overlay */}
        <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 py-14 sm:py-16 lg:py-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-neutral-300">
                {current.eyebrow}
              </span>
              <span className="h-px w-12 bg-neutral-500" />
              {current.badge && (
                <span className="rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  {current.badge}
                </span>
              )}
            </div>

            <h1 className="font-display-italic text-5xl sm:text-6xl lg:text-7xl leading-[0.94] uppercase tracking-tight">
              <span className="block text-white">{current.titleLine1}</span>
              <span className="block text-neutral-300">{current.titleLine2}</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-md leading-relaxed">
              {current.subtitle}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={current.ctaHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-[#0B0B0D] hover:bg-neutral-200 transition-colors shadow-lg"
              >
                {current.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>

              {current.secondaryLabel && current.secondaryHref && (
                <Link
                  href={current.secondaryHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/15 transition-colors backdrop-blur-sm"
                >
                  <Box className="h-4 w-4" />
                  {current.secondaryLabel}
                </Link>
              )}
            </div>

            {/* Bottom Carousel Controls (Arrows + Dots matching reference image) */}
            {slides.length > 1 && (
              <div className="mt-9 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous hero slide"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white hover:text-[#0B0B0D] transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next hero slide"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white hover:text-[#0B0B0D] transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={idx === activeIndex}
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === activeIndex
                          ? "w-6 bg-white"
                          : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
