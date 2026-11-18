"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Battery,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Heart,
  Maximize2,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import type {
  ProductDetail,
  ProductListItem,
  ProductReview,
  ProductVariant,
} from "@/lib/types";
import {
  FREE_DELIVERY_THRESHOLD_LKR,
  STANDARD_DELIVERY_FEE_LKR,
  formatDateSL,
  formatLKR,
  pickSriLankanAvatar,
} from "@/lib/constants";
import { ApiError, reviewsApi } from "@/lib/api";
import { useStore } from "@/components/providers/StoreProvider";
import { Product3DViewer } from "./Product3DViewer";
import { ProductCard } from "@/components/ui/ProductCard";
import { DialogModal } from "@/components/ui/DialogModal";

interface ProductDetailClientProps {
  product: ProductDetail;
  initialReviews: ProductReview[];
  relatedProducts: ProductListItem[];
}

export function ProductDetailClient({
  product,
  initialReviews,
  relatedProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, wishlistIds, isAuthenticated, notify } =
    useStore();

  const activeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active),
    [product.variants]
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => activeVariants.find((v) => v.in_stock) ?? activeVariants[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const has3d = Boolean(product.viewer_3d?.has_3d_model && product.viewer_3d?.model_3d_file);
  const [viewMode, setViewMode] = useState<"photo" | "3d">("photo");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Build gallery images
  const galleryImages = useMemo(() => {
    const urls: { url: string; alt: string }[] = [];
    const seen = new Set<string>();
    if (selectedVariant?.image) {
      seen.add(selectedVariant.image);
      urls.push({ url: selectedVariant.image, alt: selectedVariant.name });
    }
    for (const img of product.images ?? []) {
      if (img.image && !seen.has(img.image)) {
        seen.add(img.image);
        urls.push({ url: img.image, alt: img.alt_text || product.name });
      }
    }
    if (product.primary_image && !seen.has(product.primary_image)) {
      seen.add(product.primary_image);
      urls.push({ url: product.primary_image, alt: product.name });
    }
    if (
      product.viewer_3d?.model_3d_poster &&
      !seen.has(product.viewer_3d.model_3d_poster)
    ) {
      seen.add(product.viewer_3d.model_3d_poster);
      urls.push({
        url: product.viewer_3d.model_3d_poster,
        alt: `${product.name} 3D Poster`,
      });
    }
    return urls;
  }, [product, selectedVariant]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "overview" | "specifications" | "warranty" | "reviews" | "faqs"
  >("overview");

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const displayPrice = selectedVariant?.final_price ?? product.price;
  const availableStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;
  const inStock = selectedVariant ? selectedVariant.in_stock : product.in_stock;
  const displaySku = selectedVariant?.sku ?? product.sku;

  const rating = parseFloat(product.average_rating || "0");
  const hasCompareAt =
    product.compare_at_price &&
    parseFloat(product.compare_at_price) > parseFloat(displayPrice);
  const isWishlisted = wishlistIds.has(product.id);

  // Extract 4 highlight stats from specifications
  const quickHighlights = useMemo(() => {
    const specs = product.specifications ?? [];
    const pickSpec = (keywords: string[]) =>
      specs.find((s) =>
        keywords.some((k) => s.key.toLowerCase().includes(k))
      )?.value;

    return [
      {
        icon: Zap,
        label: pickSpec(["range"]) || (specs[0] ? `${specs[0].key}: ${specs[0].value}` : "High Efficiency"),
      },
      {
        icon: Gauge,
        label: pickSpec(["speed", "motor"]) || (specs[1] ? `${specs[1].key}: ${specs[1].value}` : "Precision Tuned"),
      },
      {
        icon: Battery,
        label:
          pickSpec(["battery", "charging"]) ||
          `${product.estimated_arrival_days || 2}-Day Dispatch`,
      },
      {
        icon: ShieldCheck,
        label: product.warranty_information || "Official Warranty",
      },
    ];
  }, [
    product.estimated_arrival_days,
    product.specifications,
    product.warranty_information,
  ]);

  // Group specifications by group name
  const groupedSpecs = useMemo(() => {
    const groups: Record<string, typeof product.specifications> = {};
    for (const s of [...(product.specifications ?? [])].sort(
      (a, b) => a.display_order - b.display_order
    )) {
      const g = s.group || "General";
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    }
    return groups;
  }, [product.specifications]);

  // Rating breakdown
  const ratingCounts = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((stars) => {
      const n = reviews.filter((r) => r.rating === stars).length;
      const pct = reviews.length > 0 ? Math.round((n / reviews.length) * 100) : 0;
      return { stars, count: n, pct };
    });
    return counts;
  }, [reviews]);

  const handleAddToCart = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    await addToCart(product.id, selectedVariant?.id ?? null, quantity, true);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!inStock || buyingNow) return;
    setBuyingNow(true);
    const ok = await addToCart(
      product.id,
      selectedVariant?.id ?? null,
      quantity,
      false
    );
    setBuyingNow(false);
    if (ok) {
      router.push("/checkout");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      notify({
        type: "success",
        title: "Product link copied",
        message: "Ready to share with fellow riders.",
      });
    } catch {
      notify({ type: "info", title: "Share URL", message: url });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewBody.trim()) return;
    setSubmittingReview(true);
    try {
      const created = await reviewsApi.submit({
        product: product.id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        review_text: reviewBody.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewTitle("");
      setReviewBody("");
      setReviewModalOpen(false);
      notify({
        type: "success",
        title: "Review published",
        message: "Thank you for sharing your ride feedback!",
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not submit review.";
      notify({ type: "error", title: "Review submission failed", message: msg });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-neutral-500 flex items-center gap-2 mb-5 flex-wrap">
        <Link href="/" className="hover:text-[#0B0B0D]">
          Home
        </Link>
        <span>›</span>
        <Link href="/shop" className="hover:text-[#0B0B0D]">
          Shop
        </Link>
        <span>›</span>
        {product.category && (
          <>
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-[#0B0B0D]"
            >
              {product.category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="font-semibold text-[#0B0B0D] truncate">
          {product.name}
        </span>
      </nav>

      {/* Top 2-Column Showcase matching Arrow X1 Showcase reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Stage & Gallery */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="relative overflow-hidden rounded-2xl bg-[#E8EAEE] border border-neutral-200/80 min-h-[380px] sm:min-h-[450px] flex items-center justify-center">
            {/* Top-left View in 3D / Photos toggle */}
            {has3d && (
              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === "3d" ? "photo" : "3d"))
                }
                className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#0B0B0D]/85 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-[#0B0B0D] transition-colors shadow"
              >
                <Box className="h-3.5 w-3.5" />
                {viewMode === "3d" ? "View Photos" : "View in 3D"}
              </button>
            )}

            {/* Top-right Fullscreen Expand button */}
            <button
              type="button"
              onClick={() => setFullscreenOpen(true)}
              aria-label="Open fullscreen product viewer"
              className="absolute top-4 right-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0B0D]/80 text-white hover:bg-[#0B0B0D] transition-colors shadow"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {viewMode === "3d" && product.viewer_3d ? (
              <Product3DViewer
                viewer={product.viewer_3d}
                fallbackPoster={product.primary_image}
                className="h-[380px] sm:h-[450px]"
              />
            ) : (
              <div className="relative w-full h-[380px] sm:h-[450px] flex items-center justify-center p-6">
                {galleryImages[activeImageIdx] ? (
                  <img
                    src={galleryImages[activeImageIdx].url}
                    alt={galleryImages[activeImageIdx].alt}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                ) : (
                  <span className="text-sm text-neutral-400">No image</span>
                )}
                {has3d && (
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white/95 border border-neutral-200 px-4 py-1.5 text-xs font-semibold text-[#0B0B0D] shadow hover:bg-white transition-colors"
                  >
                    <Box className="h-3.5 w-3.5" />
                    Drag to rotate in 3D
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => {
                  setViewMode("photo");
                  setActiveImageIdx(
                    (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                  );
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#0B0B0D] hover:bg-[#F4F5F7]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex flex-1 items-center gap-2.5 overflow-x-auto py-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={`${img.url}-${i}`}
                    type="button"
                    onClick={() => {
                      setViewMode("photo");
                      setActiveImageIdx(i);
                    }}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition-all ${
                      viewMode === "photo" && activeImageIdx === i
                        ? "border-[#0B0B0D]"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}

                {has3d && (
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className={`h-16 w-20 shrink-0 rounded-xl border-2 bg-[#0B0B0D] text-white flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all ${
                      viewMode === "3d"
                        ? "border-[#0B0B0D] ring-2 ring-[#0B0B0D]/30"
                        : "border-transparent opacity-85 hover:opacity-100"
                    }`}
                  >
                    <Box className="h-4 w-4" />
                    3D View
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-label="Next image"
                onClick={() => {
                  setViewMode("photo");
                  setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#0B0B0D] hover:bg-[#F4F5F7]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Info & Actions Column */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5">
            {product.is_featured && (
              <span className="rounded-full bg-[#0B0B0D] px-3 py-0.5 text-[11px] font-bold text-white">
                Best Seller
              </span>
            )}
            {product.brand && (
              <Link
                href={`/shop?brand=${product.brand.slug}`}
                className="rounded-full bg-[#F4F5F7] border border-neutral-200 px-3 py-0.5 text-[11px] font-semibold text-neutral-700 hover:border-[#0B0B0D]"
              >
                {product.brand.name}
              </Link>
            )}
            <span className="font-mono text-[11px] text-neutral-500 ml-auto">
              SKU: {displaySku}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B0B0D] leading-tight">
            {product.name}
          </h1>

          {product.short_description && (
            <p className="mt-2 text-base text-neutral-600 leading-relaxed max-w-[65ch]">
              {product.short_description}
            </p>
          )}

          {/* Ratings */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className="flex items-center gap-0.5 text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(rating || 5)
                      ? "fill-[#F59E0B] text-[#F59E0B]"
                      : "fill-neutral-200 text-neutral-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-[#0B0B0D] tabular-nums">
              {rating > 0 ? rating.toFixed(1) : "5.0"}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className="text-neutral-500 hover:text-[#0B0B0D] underline-offset-2 hover:underline"
            >
              ({reviews.length} reviews)
            </button>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0B0B0D] tabular-nums">
              {formatLKR(displayPrice)}
            </span>
            {hasCompareAt && (
              <span className="text-base text-neutral-400 line-through tabular-nums">
                {formatLKR(product.compare_at_price)}
              </span>
            )}
            {product.discount_percentage > 0 && (
              <span className="rounded-full bg-[#DC2626] px-2.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                {Math.round(product.discount_percentage)}% OFF
              </span>
            )}
          </div>

          {/* Mintpay 3x quick info */}
          <p className="mt-1.5 text-[11px] text-neutral-500">
            Or 3 interest-free payments of{" "}
            <strong className="text-[#0B0B0D] tabular-nums">
              {formatLKR(parseFloat(displayPrice) / 3)}
            </strong>{" "}
            with Koko / Mintpay ·{" "}
            {parseFloat(displayPrice) >= FREE_DELIVERY_THRESHOLD_LKR
              ? "Free Islandwide Delivery"
              : `Delivery Rs. ${STANDARD_DELIVERY_FEE_LKR.toLocaleString()}`}
          </p>

          {/* Stock Status */}
          <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                In Stock ({availableStock} available) – Ready for Delivery (Est.{" "}
                {product.estimated_arrival_days || 2} days)
              </span>
            ) : (
              <span className="text-red-600">Currently Out of Stock</span>
            )}
          </div>

          {/* Variants Selector */}
          {activeVariants.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-200">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Select Configuration / Size
              </p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((variant) => {
                  const selected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                        setActiveImageIdx(0);
                      }}
                      className={`rounded-xl border px-3.5 py-2 text-left text-xs transition-all ${
                        selected
                          ? "border-[#0B0B0D] bg-[#0B0B0D] text-white"
                          : "border-neutral-300 bg-white text-[#0B0B0D] hover:border-[#0B0B0D]"
                      } ${!variant.in_stock ? "opacity-50" : ""}`}
                    >
                      <span className="font-semibold block">{variant.name}</span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          selected ? "text-neutral-300" : "text-neutral-500"
                        }`}
                      >
                        {formatLKR(variant.final_price)} ·{" "}
                        {variant.in_stock ? `${variant.stock_quantity} left` : "Out"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4-Column Mini Spec Strip matching reference */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-[#F4F5F7] py-3">
            {quickHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center px-2 py-1.5"
                >
                  <Icon className="h-4 w-4 text-[#0B0B0D] mb-1" />
                  <span className="text-[11px] font-semibold text-[#0B0B0D] leading-tight line-clamp-2">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quantity + Add to Cart + Buy Now */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#0B0B0D]">Quantity:</span>
              <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2 text-neutral-600 hover:text-[#0B0B0D]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-4 text-xs font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))
                  }
                  aria-label="Increase quantity"
                  className="p-2 text-neutral-600 hover:text-[#0B0B0D]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!inStock || adding}
              onClick={handleAddToCart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0B0D] py-3.5 px-6 text-sm font-bold text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {!inStock
                ? "Out of Stock"
                : adding
                ? "Adding to Cart..."
                : "Add to Cart"}
            </button>

            <button
              type="button"
              disabled={!inStock || buyingNow}
              onClick={handleBuyNow}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0B0B0D] bg-white py-3 px-6 text-sm font-bold text-[#0B0B0D] hover:bg-[#F4F5F7] disabled:opacity-40 transition-colors"
            >
              <Zap className="h-4 w-4" />
              {buyingNow ? "Preparing Checkout..." : "Buy Now"}
            </button>
          </div>

          {/* Wishlist / Share / 3D action row */}
          <div className="mt-4 flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-neutral-600">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="inline-flex items-center gap-1.5 hover:text-[#0B0B0D] transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${
                  isWishlisted ? "fill-[#0B0B0D] text-[#0B0B0D]" : ""
                }`}
              />
              {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-[#0B0B0D] transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            {has3d && (
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className="inline-flex items-center gap-1.5 hover:text-[#0B0B0D] transition-colors"
              >
                <Box className="h-4 w-4" />
                3D / AR View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Tabs matching Arrow X1 Showcase reference */}
      <div className="mt-12 border-b border-neutral-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-3" role="tablist">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "specifications", label: "Specifications" },
              { id: "warranty", label: "Warranty & Delivery" },
              { id: "reviews", label: `Reviews (${reviews.length})` },
              { id: "faqs", label: "FAQs" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-5 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[#0B0B0D] text-white"
                  : "bg-[#F4F5F7] text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Tab Panel */}
      <div className="py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Copy */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0D] leading-tight">
                Power Meets Performance
              </h2>
              <p className="text-base text-neutral-600 leading-relaxed max-w-[65ch]">
                {product.description || product.short_description}
              </p>
              <ul className="space-y-2 pt-1">
                {(product.specifications ?? []).slice(0, 4).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2.5 text-xs font-semibold text-[#0B0B0D]"
                  >
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0B0B0D] text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span>
                      {s.key}: <span className="font-normal text-neutral-600">{s.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setActiveTab("specifications")}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800"
              >
                Explore Full Specifications
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Center Sri Lankan Action Lifestyle Card */}
            <div className="lg:col-span-4 relative overflow-hidden rounded-2xl bg-[#0B0B0D] aspect-[16/10] lg:aspect-auto lg:h-[300px] border border-neutral-200 group">
              <img
                src="/images/about-hero-rider.png"
                alt="Sri Lankan electric mountain cyclist riding across scenic highland terrain"
                className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold">
                    SRI LANKAN TERRAIN TESTED
                  </p>
                  <p className="text-sm font-bold">
                    Engineered for Hills & Daily Commutes
                  </p>
                </div>
                {has3d && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("3d");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="shrink-0 rounded-full bg-white text-[#0B0B0D] px-3.5 py-1.5 text-xs font-bold hover:bg-neutral-200"
                  >
                    Launch 3D
                  </button>
                )}
              </div>
            </div>

            {/* Right Technical Specifications Card */}
            <div className="lg:col-span-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200/80 p-5">
              <h3 className="font-display text-xl text-[#0B0B0D] mb-4">
                Technical Specifications
              </h3>
              <dl className="divide-y divide-neutral-200/80 text-xs">
                {(product.specifications ?? []).slice(0, 7).map((spec) => (
                  <div
                    key={spec.id}
                    className="py-2.5 flex items-center justify-between gap-4"
                  >
                    <dt className="font-semibold text-[#0B0B0D] shrink-0">
                      {spec.key}
                    </dt>
                    <dd className="text-neutral-600 text-right">{spec.value}</dd>
                  </div>
                ))}
                {product.warranty_information && (
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <dt className="font-semibold text-[#0B0B0D]">Warranty</dt>
                    <dd className="text-neutral-600 text-right">
                      {product.warranty_information}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedSpecs).map(([group, specs]) => (
              <div
                key={group}
                className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-5"
              >
                <h3 className="font-display text-lg text-[#0B0B0D] mb-3">
                  {group}
                </h3>
                <dl className="divide-y divide-neutral-200 text-xs">
                  {specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="py-2.5 flex items-center justify-between gap-4"
                    >
                      <dt className="font-semibold text-neutral-700">
                        {spec.key}
                      </dt>
                      <dd className="font-bold text-[#0B0B0D] text-right">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}

        {activeTab === "warranty" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[#F4F5F7] p-6 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#0B0B0D]" />
                <h3 className="font-display text-xl text-[#0B0B0D]">
                  Warranty Coverage
                </h3>
              </div>
              <p className="text-sm font-semibold text-[#0B0B0D]">
                {product.warranty_information ||
                  "Standard Arrow Ventures Manufacturer Warranty"}
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Your official Arrow Ventures invoice and warranty snapshot are preserved
                on every order and downloadable anytime as a PDF from your Customer
                Portal or Guest Tracking page.
              </p>
              <Link
                href="/policies/returns"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B0B0D] underline underline-offset-2"
              >
                Read Warranty & Return Policy
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-[#F4F5F7] p-6 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-[#0B0B0D]" />
                <h3 className="font-display text-xl text-[#0B0B0D]">
                  Islandwide Delivery
                </h3>
              </div>
              <p className="text-sm font-semibold text-[#0B0B0D]">
                Estimated Lead Time: {product.estimated_arrival_days || 2} Business Days
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Free islandwide delivery applies automatically to all orders of{" "}
                <strong>{formatLKR(FREE_DELIVERY_THRESHOLD_LKR)}</strong> or above.
                Orders below that carry a flat{" "}
                <strong>{formatLKR(STANDARD_DELIVERY_FEE_LKR)}</strong> delivery
                charge.
              </p>
              <Link
                href="/policies/shipping"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B0B0D] underline underline-offset-2"
              >
                View Shipping Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="max-w-3xl space-y-3">
            {[
              {
                q: "Can I pay in installments with Koko or Mintpay?",
                a: "Yes! Both Koko BNPL and Mintpay (3 interest-free installments) are available directly at checkout alongside Direct Bank Transfer.",
              },
              {
                q: "When is my order confirmed when paying by Bank Transfer?",
                a: "Orders remain in Pending status until you upload your deposit slip / transfer receipt and our team verifies the funds. You can upload or resubmit your slip directly from Order Tracking or your Customer Portal.",
              },
              {
                q: "Are lithium batteries covered by special shipping safety rules?",
                a: "Yes. Electric bicycles and lithium power packs are transported by approved islandwide courier arrangements with protective packaging.",
              },
              {
                q: "Does the 3D viewer match the exact model?",
                a: "Our interactive 3D and AR viewer lets you inspect geometry and proportions in 360°; refer to the written specifications and selected variant for final confirmed build details.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-4"
              >
                <h4 className="text-sm font-bold text-[#0B0B0D]">{faq.q}</h4>
                <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="text-xs text-neutral-600">
            Jump below to read all verified rider reviews or submit your own.
          </div>
        )}
      </div>

      {/* Customer Reviews Section matching Image 3 */}
      <section id="reviews" className="pt-8 pb-12 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-2xl sm:text-3xl text-[#0B0B0D]">
            Customer Reviews
          </h2>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Write a Review
              </button>
            ) : (
              <Link
                href={`/login?redirect=/products/${product.slug}`}
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#F4F5F7]"
              >
                Sign in to Review
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Score & Bars */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4 items-center rounded-2xl bg-[#F4F5F7] p-5 border border-neutral-200/70">
            <div>
              <p className="font-display text-5xl text-[#0B0B0D] tabular-nums">
                {rating > 0 ? rating.toFixed(1) : "5.0"}
              </p>
              <div className="flex items-center gap-0.5 text-[#F59E0B] mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">
                Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="space-y-1.5">
              {ratingCounts.map((row) => (
                <div key={row.stars} className="flex items-center gap-2 text-[11px]">
                  <span className="w-8 text-neutral-600 font-medium shrink-0">
                    {row.stars} ★
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-neutral-500 tabular-nums">
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Review Cards */}
          <div className="lg:col-span-8">
            {reviews.length === 0 ? (
              <div className="rounded-2xl bg-[#F4F5F7] p-8 text-center border border-neutral-200/70">
                <p className="text-sm font-semibold text-[#0B0B0D]">
                  No reviews yet for this model
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Be the first Sri Lankan rider to share your feedback!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviews.slice(0, 6).map((rev, idx) => (
                  <article
                    key={rev.id}
                    className="rounded-2xl bg-[#F4F5F7] p-4 border border-neutral-200/70 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <img
                          src={pickSriLankanAvatar(rev.user_name, idx)}
                          alt={rev.user_name}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover border border-white shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0B0B0D] truncate">
                            {rev.user_name}
                          </p>
                          <div className="flex items-center gap-0.5 text-[#F59E0B]">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${
                                  s <= rev.rating
                                    ? "fill-[#F59E0B] text-[#F59E0B]"
                                    : "fill-neutral-200 text-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#0B0B0D] mb-1">
                        {rev.title}
                      </p>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        “{rev.review_text}”
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-neutral-200/70 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{formatDateSL(rev.created_at)}</span>
                      {rev.verified_purchase && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* You May Also Like matching Image 3 */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 pb-6 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl sm:text-3xl text-[#0B0B0D]">
              You May Also Like
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B0B0D] hover:underline"
            >
              View All Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} compact />
            ))}
          </div>
        </section>
      )}

      {/* Fullscreen Viewer Modal */}
      <DialogModal
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        title={product.name}
        maxWidthClass="max-w-4xl"
      >
        <div className="p-4 sm:p-6 bg-[#EAECEF]">
          {has3d && viewMode === "3d" && product.viewer_3d ? (
            <Product3DViewer
              viewer={product.viewer_3d}
              fallbackPoster={product.primary_image}
              className="h-[65dvh]"
            />
          ) : galleryImages[activeImageIdx] ? (
            <div className="h-[65dvh] flex items-center justify-center">
              <img
                src={galleryImages[activeImageIdx].url}
                alt={galleryImages[activeImageIdx].alt}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
        </div>
      </DialogModal>

      {/* Submit Review Modal */}
      <DialogModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review ${product.name}`}
      >
        <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B0B0D] mb-1.5">
              Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  aria-label={`Rate ${s} stars`}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      s <= reviewRating
                        ? "fill-[#F59E0B] text-[#F59E0B]"
                        : "text-neutral-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="rev-title"
              className="block text-xs font-bold text-[#0B0B0D] mb-1"
            >
              Review Headline
            </label>
            <input
              id="rev-title"
              required
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g., Effortless hill climbs and solid battery range"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="rev-body"
              className="block text-xs font-bold text-[#0B0B0D] mb-1"
            >
              Your Experience
            </label>
            <textarea
              id="rev-body"
              required
              rows={4}
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="Share how it rides, battery longevity, or build quality..."
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="rounded-full bg-[#0B0B0D] px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submittingReview ? "Publishing..." : "Publish Review"}
            </button>
          </div>
        </form>
      </DialogModal>
    </div>
  );
}
