import React, { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BatteryCharging,
  Bike,
  Box,
  Cpu,
  HardHat,
  Headphones,
  LayoutGrid,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import {
  getBrandsServer,
  getCampaignsServer,
  getCategoriesServer,
  getProductsServer,
  getReviewsServer,
} from "@/lib/server-api";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
import { ProductCard } from "@/components/ui/ProductCard";

function pickCategoryIcon(slug: string) {
  switch (slug) {
    case "e-bikes":
      return Bike;
    case "batteries-chargers":
      return BatteryCharging;
    case "spare-parts":
      return Wrench;
    case "accessories":
      return HardHat;
    default:
      return Cpu;
  }
}

async function HomeContent() {
  const [categories, brands, featuredData, allProductsData, campaigns, reviews] =
    await Promise.all([
      getCategoriesServer(),
      getBrandsServer(),
      getProductsServer("is_featured=true&page_size=8"),
      getProductsServer("page_size=8"),
      getCampaignsServer(),
      getReviewsServer(),
    ]);

  // Featured grid: up to 4 featured items, falling back to top live products if fewer than 4 are marked featured
  const featuredList = [...featuredData.results];
  for (const item of allProductsData.results) {
    if (featuredList.length >= 4) break;
    if (!featuredList.some((f) => f.id === item.id)) {
      featuredList.push(item);
    }
  }
  const displayFeatured = featuredList.slice(0, 4);

  return (
    <>
      {/* 1. Hero Carousel */}
      <HeroCarousel
        campaigns={campaigns}
        featuredProducts={
          featuredData.results.length > 0
            ? featuredData.results
            : allProductsData.results
        }
      />

      {/* 2. Floating Category Icon Strip matching reference Storefront */}
      <section aria-label="Product Categories" className="mx-auto max-w-7xl w-full px-4 sm:px-6 -mt-6 relative z-20">
        <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-lg px-3 py-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {categories.map((cat) => {
              const Icon = pickCategoryIcon(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group flex flex-col items-center justify-center text-center rounded-xl p-2.5 hover:bg-[#F4F5F7] transition-colors"
                >
                  <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F5F7] text-[#0B0B0D] group-hover:bg-[#0B0B0D] group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0B0B0D] leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    {cat.product_count} items
                  </span>
                </Link>
              );
            })}

            <Link
              href="/shop?has_3d_model=true"
              className="group flex flex-col items-center justify-center text-center rounded-xl p-2.5 hover:bg-[#F4F5F7] transition-colors"
            >
              <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F5F7] text-[#0B0B0D] group-hover:bg-[#0B0B0D] group-hover:text-white transition-colors">
                <Box className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0B0B0D] leading-tight">
                3D & AR Models
              </span>
              <span className="text-[11px] text-neutral-500 mt-0.5">
                Interactive view
              </span>
            </Link>

            <Link
              href="/shop"
              className="group flex flex-col items-center justify-center text-center rounded-xl p-2.5 hover:bg-[#F4F5F7] transition-colors"
            >
              <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F5F7] text-[#0B0B0D] group-hover:bg-[#0B0B0D] group-hover:text-white transition-colors">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0B0B0D] leading-tight">
                View All →
              </span>
              <span className="text-[11px] text-neutral-500 mt-0.5">
                Full Catalog
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-12 sm:pt-14 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                FEATURED PRODUCTS
              </span>
              <span className="h-px w-12 bg-neutral-300" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#0B0B0D]">
              Power. Performance. Style.
            </h2>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-neutral-300 bg-white px-5 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#0B0B0D] hover:text-white hover:border-[#0B0B0D] transition-colors"
          >
            View All Products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayFeatured.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              badgeText={
                idx === 0
                  ? "Best Seller"
                  : idx === 1
                  ? "New"
                  : product.discount_percentage >= 10
                  ? `${Math.round(product.discount_percentage)}% OFF`
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      {/* 4. Two-Column Promo Split Banners matching reference image */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Promo: Parts */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0B0B0D] text-white min-h-[210px] flex items-center">
            <img
              src="/images/promo-parts.png"
              alt="High-quality e-bike motors, disc rotors and drivetrain parts"
              className="absolute inset-y-0 left-0 h-full w-3/5 object-cover object-left opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-[#0B0B0D]/80 to-[#0B0B0D]" />
            <div className="relative z-10 ml-auto w-full sm:w-3/5 p-6 sm:p-8 text-left">
              <h3 className="font-display text-2xl sm:text-3xl text-white">
                Upgrade Your Ride
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-300">
                High-Quality Motors, Batteries & Spare Parts
              </p>
              <Link
                href="/shop?category=spare-parts"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-[#0B0B0D] hover:bg-neutral-200 transition-colors"
              >
                Explore Parts
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Promo: Safety Gear */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0B0B0D] text-white min-h-[210px] flex items-center">
            <img
              src="/images/promo-safety.png"
              alt="Arrow Aero Pro Smart LED Safety Helmet"
              className="absolute inset-y-0 left-0 h-full w-3/5 object-cover object-left opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-[#0B0B0D]/80 to-[#0B0B0D]" />
            <div className="relative z-10 ml-auto w-full sm:w-3/5 p-6 sm:p-8 text-left">
              <h3 className="font-display text-2xl sm:text-3xl text-white">
                Ride Safe, Ride Better
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-300">
                Smart LED Helmets & Touring Gear
              </p>
              <Link
                href="/shop?category=accessories"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-[#0B0B0D] hover:bg-neutral-200 transition-colors"
              >
                Shop Safety Gear
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Partner Brands Strip (Live from /api/catalog/brands/) */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-6 pb-4">
          <div className="rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                OFFICIAL BRANDS
              </p>
              <p className="text-sm font-bold text-[#0B0B0D]">
                Genuine Components & Flagship Builds
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/shop?brand=${brand.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 px-4 py-2 text-xs font-bold text-[#0B0B0D] hover:border-[#0B0B0D] hover:bg-[#0B0B0D] hover:text-white transition-colors"
                >
                  <span>{brand.name}</span>
                  <span className="text-[10px] opacity-60">
                    ({brand.product_count})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. 5-Column Trust & Value Bar matching reference image */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-white py-5">
          {[
            { icon: ShieldCheck, label: "Trusted & Secure Shopping" },
            { icon: Truck, label: "Islandwide Delivery" },
            { icon: Headphones, label: "Dedicated Support" },
            { icon: Award, label: "Best Quality Guaranteed" },
            { icon: RotateCcw, label: "Easy Returns" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 text-center sm:text-left"
              >
                <Icon className="h-5 w-5 text-[#0B0B0D] shrink-0" />
                <span className="text-xs font-semibold text-[#0B0B0D] leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Customer Testimonials Carousel (Live from /api/reviews/ + Sri Lankan portraits) */}
      <TestimonialCarousel reviews={reviews} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 space-y-8 animate-pulse">
      <div className="h-[460px] rounded-2xl bg-neutral-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 rounded-2xl bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
