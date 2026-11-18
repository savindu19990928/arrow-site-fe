"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Star } from "lucide-react";
import type { ProductReview } from "@/lib/types";
import { pickSriLankanAvatar } from "@/lib/constants";

interface TestimonialCarouselProps {
  reviews: ProductReview[];
}

export function TestimonialCarousel({ reviews }: TestimonialCarouselProps) {
  const [offset, setOffset] = useState(0);

  if (reviews.length === 0) {
    return null;
  }

  const visibleCount = Math.min(3, reviews.length);
  const canRotate = reviews.length > 3;

  const visibleReviews: ProductReview[] = [];
  for (let i = 0; i < visibleCount; i++) {
    visibleReviews.push(reviews[(offset + i) % reviews.length]);
  }

  const handlePrev = () => {
    setOffset((prev) => (prev - 1 + reviews.length) % reviews.length);
  };
  const handleNext = () => {
    setOffset((prev) => (prev + 1) % reviews.length);
  };

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              WHAT OUR CUSTOMERS SAY
            </span>
            <span className="h-px w-12 bg-neutral-300" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0B0B0D]">
            Trusted by Riders Across Sri Lanka
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canRotate}
            aria-label="Previous customer reviews"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0B0D] text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canRotate}
            aria-label="Next customer reviews"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0B0D] text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {visibleReviews.map((review, idx) => (
          <article
            key={`${review.id}-${idx}`}
            className="rounded-2xl bg-[#F4F5F7] p-5 border border-neutral-200/70 flex items-start gap-4"
          >
            <img
              src={pickSriLankanAvatar(review.user_name, offset + idx)}
              alt={`${review.user_name} — Sri Lankan Arrow Ventures rider`}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-[13px] text-neutral-700 leading-relaxed line-clamp-3">
                “{review.review_text}”
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#0B0B0D]">
                  {review.user_name}
                </span>
                <div className="flex items-center gap-0.5 text-[#F59E0B]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.rating
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "fill-neutral-200 text-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                {review.verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              {review.title && (
                <Link
                  href="/shop"
                  className="mt-1 inline-block text-[11px] font-medium text-neutral-500 hover:text-[#0B0B0D] truncate max-w-full"
                >
                  {review.title}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
