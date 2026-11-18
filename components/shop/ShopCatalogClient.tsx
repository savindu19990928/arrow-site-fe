"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { catalogApi } from "@/lib/api";
import type { Brand, Category, PaginatedResponse, ProductListItem } from "@/lib/types";
import { ProductCard } from "@/components/ui/ProductCard";

interface ShopCatalogClientProps {
  initialData: PaginatedResponse<ProductListItem>;
  categories: Category[];
  brands: Brand[];
}

export function ShopCatalogClient({
  initialData,
  categories,
  brands,
}: ShopCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive active filter values directly from URL searchParams (single source of truth)
  const urlSearch = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const urlMinPrice = searchParams.get("min_price") ?? "";
  const urlMaxPrice = searchParams.get("max_price") ?? "";
  const inStock = searchParams.get("in_stock") === "true";
  const has3dModel = searchParams.get("has_3d_model") === "true";
  const isFeatured = searchParams.get("is_featured") === "true";
  const ordering = searchParams.get("ordering") ?? "-created_at";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  // Draft input state for text fields
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const [minPriceDraft, setMinPriceDraft] = useState(urlMinPrice);
  const [maxPriceDraft, setMaxPriceDraft] = useState(urlMaxPrice);

  const [data, setData] = useState<PaginatedResponse<ProductListItem>>(initialData);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const pushFilterParams = useCallback(
    (overrides: Partial<Record<string, string | boolean | number>>) => {
      const next = {
        search: overrides.search !== undefined ? String(overrides.search) : urlSearch,
        category:
          overrides.category !== undefined ? String(overrides.category) : category,
        brand: overrides.brand !== undefined ? String(overrides.brand) : brand,
        min_price:
          overrides.min_price !== undefined
            ? String(overrides.min_price)
            : urlMinPrice,
        max_price:
          overrides.max_price !== undefined
            ? String(overrides.max_price)
            : urlMaxPrice,
        in_stock:
          overrides.in_stock !== undefined ? Boolean(overrides.in_stock) : inStock,
        has_3d_model:
          overrides.has_3d_model !== undefined
            ? Boolean(overrides.has_3d_model)
            : has3dModel,
        is_featured:
          overrides.is_featured !== undefined
            ? Boolean(overrides.is_featured)
            : isFeatured,
        ordering:
          overrides.ordering !== undefined ? String(overrides.ordering) : ordering,
        page: overrides.page !== undefined ? Number(overrides.page) : page,
      };

      const params = new URLSearchParams();
      if (next.search.trim()) params.set("search", next.search.trim());
      if (next.category) params.set("category", next.category);
      if (next.brand) params.set("brand", next.brand);
      if (next.min_price) params.set("min_price", next.min_price);
      if (next.max_price) params.set("max_price", next.max_price);
      if (next.in_stock) params.set("in_stock", "true");
      if (next.has_3d_model) params.set("has_3d_model", "true");
      if (next.is_featured) params.set("is_featured", "true");
      if (next.ordering && next.ordering !== "-created_at") {
        params.set("ordering", next.ordering);
      }
      if (next.page > 1) params.set("page", String(next.page));

      const qs = params.toString();
      setLoading(true);
      router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
    },
    [
      brand,
      category,
      has3dModel,
      inStock,
      isFeatured,
      ordering,
      page,
      router,
      urlMaxPrice,
      urlMinPrice,
      urlSearch,
    ]
  );

  // Fetch products whenever searchParams changes
  useEffect(() => {
    let active = true;
    catalogApi
      .getProducts({
        search: urlSearch || undefined,
        category: category || undefined,
        brand: brand || undefined,
        min_price: urlMinPrice || undefined,
        max_price: urlMaxPrice || undefined,
        in_stock: inStock ? true : undefined,
        has_3d_model: has3dModel ? true : undefined,
        is_featured: isFeatured ? true : undefined,
        ordering: ordering || "-created_at",
        page,
      })
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    brand,
    category,
    has3dModel,
    inStock,
    isFeatured,
    ordering,
    page,
    urlMaxPrice,
    urlMinPrice,
    urlSearch,
  ]);

  const clearAllFilters = () => {
    setSearchDraft("");
    setMinPriceDraft("");
    setMaxPriceDraft("");
    setLoading(true);
    router.replace("/shop", { scroll: false });
  };

  const hasActiveFilters = Boolean(
    urlSearch ||
      category ||
      brand ||
      urlMinPrice ||
      urlMaxPrice ||
      inStock ||
      has3dModel ||
      isFeatured
  );

  const totalPages = Math.max(1, Math.ceil((data.count || 0) / 20));

  const filterSidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-[#0B0B0D] flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-[#0B0B0D]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Category
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => pushFilterParams({ category: "", page: 1 })}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              category === ""
                ? "bg-[#0B0B0D] text-white"
                : "text-neutral-700 hover:bg-[#F4F5F7]"
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => pushFilterParams({ category: cat.slug, page: 1 })}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                category === cat.slug
                  ? "bg-[#0B0B0D] text-white"
                  : "text-neutral-700 hover:bg-[#F4F5F7]"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] ${
                  category === cat.slug ? "text-neutral-300" : "text-neutral-400"
                }`}
              >
                {cat.product_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Brand
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => pushFilterParams({ brand: "", page: 1 })}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              brand === ""
                ? "bg-[#0B0B0D] text-white"
                : "text-neutral-700 hover:bg-[#F4F5F7]"
            }`}
          >
            <span>All Brands</span>
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => pushFilterParams({ brand: b.slug, page: 1 })}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                brand === b.slug
                  ? "bg-[#0B0B0D] text-white"
                  : "text-neutral-700 hover:bg-[#F4F5F7]"
              }`}
            >
              <span>{b.name}</span>
              <span
                className={`text-[10px] ${
                  brand === b.slug ? "text-neutral-300" : "text-neutral-400"
                }`}
              >
                {b.product_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Price Range (LKR)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min Rs."
            value={minPriceDraft}
            onChange={(e) => setMinPriceDraft(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-[#0B0B0D] focus:border-[#0B0B0D] focus:outline-none"
          />
          <input
            type="number"
            min={0}
            placeholder="Max Rs."
            value={maxPriceDraft}
            onChange={(e) => setMaxPriceDraft(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-[#0B0B0D] focus:border-[#0B0B0D] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            pushFilterParams({
              min_price: minPriceDraft,
              max_price: maxPriceDraft,
              page: 1,
            })
          }
          className="mt-2 w-full rounded-full bg-[#0B0B0D] py-2 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          Apply Price
        </button>
      </div>

      {/* Features & Availability Toggles */}
      <div className="space-y-2.5 pt-2 border-t border-neutral-200">
        <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-[#0B0B0D]">
          <span className="inline-flex items-center gap-1.5">
            <Box className="h-3.5 w-3.5" />
            Interactive 3D Models Only
          </span>
          <input
            type="checkbox"
            checked={has3dModel}
            onChange={(e) =>
              pushFilterParams({ has_3d_model: e.target.checked, page: 1 })
            }
            className="h-4 w-4 accent-[#0B0B0D] rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-[#0B0B0D]">
          <span>In Stock Ready to Ship</span>
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) =>
              pushFilterParams({ in_stock: e.target.checked, page: 1 })
            }
            className="h-4 w-4 accent-[#0B0B0D] rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-[#0B0B0D]">
          <span>Featured Rides Only</span>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) =>
              pushFilterParams({ is_featured: e.target.checked, page: 1 })
            }
            className="h-4 w-4 accent-[#0B0B0D] rounded"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            ARROW VENTURES CATALOG
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[#0B0B0D] mt-1">
            Electric Cycles, Parts & Gear
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Showing <strong className="tabular-nums">{data.results.length}</strong> of{" "}
            <strong className="tabular-nums">{data.count}</strong> products across Sri Lanka.
          </p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              pushFilterParams({ search: searchDraft, page: 1 });
            }}
            className="relative flex-1 sm:w-64"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search name or SKU..."
              className="w-full rounded-full border border-neutral-300 bg-[#F4F5F7] pl-9 pr-4 py-2 text-xs text-[#0B0B0D] focus:border-[#0B0B0D] focus:bg-white focus:outline-none"
            />
          </form>

          <select
            aria-label="Sort products"
            value={ordering}
            onChange={(e) =>
              pushFilterParams({ ordering: e.target.value, page: 1 })
            }
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B0B0D] focus:border-[#0B0B0D] focus:outline-none"
          >
            <option value="-created_at">Newest Arrivals</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-average_rating">Highest Rated</option>
          </select>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B0B0D]"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {category && (
            <button
              type="button"
              onClick={() => pushFilterParams({ category: "", page: 1 })}
              className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] text-white px-3 py-1 text-xs font-semibold"
            >
              Category: {category}
              <X className="h-3 w-3" />
            </button>
          )}
          {brand && (
            <button
              type="button"
              onClick={() => pushFilterParams({ brand: "", page: 1 })}
              className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] text-white px-3 py-1 text-xs font-semibold"
            >
              Brand: {brand}
              <X className="h-3 w-3" />
            </button>
          )}
          {has3dModel && (
            <button
              type="button"
              onClick={() => pushFilterParams({ has_3d_model: false, page: 1 })}
              className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] text-white px-3 py-1 text-xs font-semibold"
            >
              3D Interactive
              <X className="h-3 w-3" />
            </button>
          )}
          {inStock && (
            <button
              type="button"
              onClick={() => pushFilterParams({ in_stock: false, page: 1 })}
              className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] text-white px-3 py-1 text-xs font-semibold"
            >
              In Stock
              <X className="h-3 w-3" />
            </button>
          )}
          {urlSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                pushFilterParams({ search: "", page: 1 });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] text-white px-3 py-1 text-xs font-semibold"
            >
              “{urlSearch}”
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 rounded-2xl border border-neutral-200 bg-white p-5">
            {filterSidebar}
          </div>
        </aside>

        {mobileFiltersOpen && (
          <div className="lg:hidden rounded-2xl border border-neutral-200 bg-white p-5">
            {filterSidebar}
          </div>
        )}

        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 rounded-2xl bg-neutral-200" />
              ))}
            </div>
          ) : data.results.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] py-16 px-6 text-center">
              <p className="font-display text-2xl text-[#0B0B0D]">
                No matching products found
              </p>
              <p className="mt-1.5 text-sm text-neutral-600">
                Try clearing one of your active filters or searching a different keyword.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-5 rounded-full bg-[#0B0B0D] px-6 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={!data.previous || page <= 1}
                    onClick={() => pushFilterParams({ page: page - 1 })}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-[#0B0B0D] disabled:opacity-40 hover:bg-[#F4F5F7]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <span className="px-3 text-xs font-semibold text-neutral-600 tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!data.next || page >= totalPages}
                    onClick={() => pushFilterParams({ page: page + 1 })}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-[#0B0B0D] disabled:opacity-40 hover:bg-[#F4F5F7]"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
