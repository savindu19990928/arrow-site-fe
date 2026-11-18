"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Box, Heart, ShoppingCart, Star } from "lucide-react";
import type { ProductListItem } from "@/lib/types";
import { formatLKR } from "@/lib/constants";
import { useStore } from "@/components/providers/StoreProvider";

interface ProductCardProps {
  product: ProductListItem;
  badgeText?: string;
  compact?: boolean;
}

export function ProductCard({ product, badgeText, compact = false }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const [adding, setAdding] = useState(false);

  const isWishlisted = wishlistIds.has(product.id);
  const rating = parseFloat(product.average_rating || "0");
  const hasCompareAt =
    product.compare_at_price &&
    parseFloat(product.compare_at_price) > parseFloat(product.price);

  const computedBadge =
    badgeText ??
    (product.discount_percentage >= 12
      ? `${Math.round(product.discount_percentage)}% OFF`
      : product.is_featured
      ? "Best Seller"
      : product.discount_percentage > 0
      ? "Sale"
      : undefined);

  const isRedBadge =
    computedBadge === "Sale" || computedBadge?.includes("OFF");

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.in_stock || adding) return;
    setAdding(true);
    await addToCart(product.id, null, 1, true);
    setAdding(false);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-[#F4F5F7] p-3.5 border border-transparent hover:border-neutral-200 hover:bg-white hover:shadow-lg transition-all duration-200">
      <div>
        {/* Stage */}
        <div className="relative overflow-hidden rounded-xl bg-white aspect-[4/3] mb-3.5 border border-neutral-100">
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            {product.primary_image ? (
              <img
                src={product.primary_image}
                alt={product.name}
                width={480}
                height={360}
                loading="lazy"
                className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                No image
              </div>
            )}
          </Link>

          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {computedBadge && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight text-white ${
                  isRedBadge ? "bg-[#DC2626]" : "bg-[#0B0B0D]"
                }`}
              >
                {computedBadge}
              </span>
            )}
            {product.has_3d_model && (
              <span
                title="Interactive 3D & AR Viewer available"
                className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#0B0B0D] shadow-sm border border-neutral-200"
              >
                <Box className="h-3 w-3" />
                3D
              </span>
            )}
          </div>

          {/* Wishlist heart top-right */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            className={`absolute top-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              isWishlisted
                ? "bg-[#0B0B0D] text-white border-[#0B0B0D]"
                : "bg-white/90 text-neutral-600 border-neutral-200 hover:text-[#0B0B0D] hover:bg-white"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Info */}
        <Link href={`/products/${product.slug}`} className="block">
          {!compact && (
            <p className="text-[11px] font-medium text-neutral-500 mb-0.5 truncate">
              {product.category?.name}
            </p>
          )}
          <h3 className="font-semibold text-[15px] leading-snug text-[#0B0B0D] line-clamp-2 min-h-[2.6rem] group-hover:underline decoration-neutral-400 underline-offset-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating row */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-0.5 text-[#F59E0B]" aria-label={`Rated ${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(rating || 5)
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : "fill-neutral-200 text-neutral-200"
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-[#0B0B0D] tabular-nums">
            {rating > 0 ? rating.toFixed(1) : "New"}
          </span>
          <span className="text-neutral-500 tabular-nums">
            ({product.review_count || 0})
          </span>
        </div>

        {/* Price row */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-extrabold text-[#0B0B0D] tabular-nums">
            {formatLKR(product.price)}
          </span>
          {hasCompareAt && (
            <span className="text-xs text-neutral-400 line-through tabular-nums">
              {formatLKR(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled={!product.in_stock || adding}
        onClick={handleAddToCart}
        className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-semibold transition-all ${
          product.in_stock
            ? "bg-[#0B0B0D] text-white hover:bg-neutral-800 active:scale-[0.98]"
            : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
        }`}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        {!product.in_stock
          ? "Out of Stock"
          : adding
          ? "Adding..."
          : "Add to Cart"}
      </button>
    </article>
  );
}
