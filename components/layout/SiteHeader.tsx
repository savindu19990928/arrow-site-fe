"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/ui/SocialIcons";
import { ArrowLogo } from "@/components/ui/ArrowLogo";
import { useStore } from "@/components/providers/StoreProvider";
import { catalogApi } from "@/lib/api";
import { formatLKR } from "@/lib/constants";
import type { ProductListItem } from "@/lib/types";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "All Products", href: "/shop" },
      { label: "Electric Bicycles", href: "/shop?category=e-bikes" },
      { label: "3D Interactive Models", href: "/shop?has_3d_model=true" },
      { label: "Featured Rides", href: "/shop?is_featured=true" },
    ],
  },
  {
    label: "Accessories",
    href: "/shop?category=accessories",
    children: [
      { label: "All Accessories", href: "/shop?category=accessories" },
      { label: "Smart Helmets", href: "/shop?category=accessories&search=helmet" },
      { label: "Pannier Bags", href: "/shop?category=accessories&search=pannier" },
    ],
  },
  {
    label: "Parts",
    href: "/shop?category=spare-parts",
    children: [
      { label: "All Spare Parts", href: "/shop?category=spare-parts" },
      { label: "Batteries & Chargers", href: "/shop?category=batteries-chargers" },
      { label: "Motors & Drivetrains", href: "/shop?category=spare-parts" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isAdmin,
    cart,
    setIsCartOpen,
    wishlistItems,
    logout,
  } = useStore();

  const [openDropdown, setOpenDropdown] = useState<{ path: string; name: string } | null>(null);
  const [searchOpenAt, setSearchOpenAt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<ProductListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [accountOpenAt, setAccountOpenAt] = useState<string | null>(null);
  const [mobileOpenAt, setMobileOpenAt] = useState<string | null>(null);

  const searchOpen = searchOpenAt === pathname;
  const accountMenuOpen = accountOpenAt === pathname;
  const mobileMenuOpen = mobileOpenAt === pathname;
  const activeDropdown = openDropdown?.path === pathname ? openDropdown.name : null;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Outside click closes dropdowns
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setAccountOpenAt(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced instant search preview
  useEffect(() => {
    const q = searchTerm.trim();
    if (!searchOpen || q.length < 2) {
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await catalogApi.getProducts({ search: q, page_size: 5 });
        setLiveResults(res.results.slice(0, 5));
      } catch {
        setLiveResults([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchTerm, searchOpen]);

  const visibleSearchResults =
    searchOpen && searchTerm.trim().length >= 2 ? liveResults : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpenAt(null);
    if (q) {
      router.push(`/shop?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  };

  const isNavActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/shop")) return pathname === "/shop" && href === "/shop";
    return pathname.startsWith(href);
  };

  const cartCount = cart?.total_items_count ?? 0;

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-white">
      {/* Top Dark Utility Bar matching reference screenshots */}
      <div className="bg-[#0B0B0D] text-neutral-200 text-[11px] sm:text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 truncate">
            <span className="inline-flex items-center gap-1.5 font-medium text-white shrink-0">
              <Truck className="h-3.5 w-3.5 text-neutral-300" />
              Free Islandwide Delivery
              <span className="hidden md:inline text-neutral-400">
                (Rs. 100,000+)
              </span>
            </span>
            <span className="hidden sm:inline text-neutral-600">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-neutral-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Trusted by 10,000+ Cyclists
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/track-order"
              className="hover:text-white transition-colors"
            >
              Track Order
            </Link>
            <span className="text-neutral-600">|</span>
            <Link
              href="/contact#faqs"
              className="hover:text-white transition-colors hidden sm:inline"
            >
              Help
            </Link>
            <span className="text-neutral-600 hidden sm:inline">|</span>
            <Link
              href="/contact"
              className="hover:text-white transition-colors hidden sm:inline"
            >
              Contact
            </Link>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-neutral-800">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Arrow Ventures Facebook"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <FacebookIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Arrow Ventures YouTube"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <YoutubeIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Arrow Ventures Instagram"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main White Navigation Bar */}
      <div className="border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setMobileOpenAt((v) => (v === pathname ? null : pathname))
              }
              aria-label="Toggle navigation menu"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-[#0B0B0D] hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="shrink-0" aria-label="Arrow Ventures Home">
              <ArrowLogo variant="dark" />
            </Link>
          </div>

          {/* Center Nav Pills */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href);
              if (item.children) {
                const isOpen = activeDropdown === item.label;
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() =>
                      setOpenDropdown({ path: pathname, name: item.label })
                    }
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                        active
                          ? "bg-[#0B0B0D] text-white"
                          : "text-neutral-700 hover:text-[#0B0B0D] hover:bg-neutral-100"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Link>

                    {isOpen && (
                      <div className="absolute left-0 top-full pt-1.5 w-56 z-50">
                        <div className="rounded-2xl bg-white border border-neutral-200 shadow-xl p-1.5">
                          {item.children.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              className="block rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F4F5F7] hover:text-[#0B0B0D] transition-colors"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    active
                      ? "bg-[#0B0B0D] text-white"
                      : "text-neutral-700 hover:text-[#0B0B0D] hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSearchOpenAt((v) => (v === pathname ? null : pathname));
                setTimeout(() => searchInputRef.current?.focus(), 40);
              }}
              aria-label="Search products"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0B0B0D] hover:bg-neutral-100 transition-colors"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            {isAuthenticated && (
              <Link
                href="/account?tab=wishlist"
                aria-label="Wishlist"
                className="relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0B0B0D] hover:bg-neutral-100 transition-colors"
              >
                <Heart className="h-[18px] w-[18px]" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0B0B0D] px-1 text-[10px] font-bold text-white tabular-nums">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
            )}

            {/* Account Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setAccountOpenAt((v) => (v === pathname ? null : pathname))
                }
                aria-label="Account menu"
                aria-expanded={accountMenuOpen}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 sm:px-3 text-[#0B0B0D] hover:bg-neutral-100 transition-colors"
              >
                <User className="h-[18px] w-[18px]" />
                {isAuthenticated && (
                  <span className="hidden xl:inline text-xs font-semibold max-w-[90px] truncate">
                    {user?.first_name || "Account"}
                  </span>
                )}
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white border border-neutral-200 shadow-xl p-2 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                        <p className="text-xs font-bold text-[#0B0B0D] truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {user?.email}
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-700">
                          {user?.role}
                        </span>
                      </div>
                      <Link
                        href="/account"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F4F5F7] hover:text-[#0B0B0D]"
                      >
                        Customer Portal & Orders
                      </Link>
                      <Link
                        href="/account?tab=addresses"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F4F5F7] hover:text-[#0B0B0D]"
                      >
                        Saved Addresses
                      </Link>
                      <Link
                        href="/account?tab=wishlist"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F4F5F7] hover:text-[#0B0B0D]"
                      >
                        Wishlist ({wishlistItems.length})
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="mt-1 flex items-center gap-2 rounded-xl bg-[#0B0B0D] px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpenAt(null);
                          logout();
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block rounded-xl bg-[#0B0B0D] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-neutral-800"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="mt-1.5 block rounded-xl border border-neutral-200 px-3 py-2 text-center text-xs font-semibold text-[#0B0B0D] hover:bg-neutral-50"
                      >
                        Create Account
                      </Link>
                      <div className="my-1.5 border-t border-neutral-100" />
                      <Link
                        href="/track-order"
                        className="block rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F4F5F7]"
                      >
                        Track Guest Order
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon with Count */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart with ${cartCount} items`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0B0B0D] hover:bg-neutral-100 transition-colors"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0B0B0D] px-1 text-[10px] font-bold text-white tabular-nums">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search electric bicycles, 48V batteries, motors, helmets, SKU..."
                    className="w-full rounded-full border border-neutral-300 bg-[#F4F5F7] pl-10 pr-4 py-2 text-sm text-[#0B0B0D] placeholder:text-neutral-500 focus:border-[#0B0B0D] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-[#0B0B0D] px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpenAt(null)}
                  aria-label="Close search"
                  className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>

              {(searching || visibleSearchResults.length > 0) && (
                <div className="mt-2 rounded-2xl border border-neutral-200 bg-white shadow-lg divide-y divide-neutral-100 overflow-hidden">
                  {searching ? (
                    <div className="px-4 py-3 text-xs text-neutral-500">
                      Searching catalog...
                    </div>
                  ) : (
                    visibleSearchResults.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#F4F5F7] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.primary_image && (
                            <img
                              src={p.primary_image}
                              alt={p.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-contain bg-white border border-neutral-200 p-0.5 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0B0B0D] truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {p.category?.name} · {p.sku}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#0B0B0D] tabular-nums shrink-0">
                          {formatLKR(p.price)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  isNavActive(item.href)
                    ? "bg-[#0B0B0D] text-white"
                    : "text-neutral-700 hover:bg-[#F4F5F7]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-2">
              <Link
                href="/track-order"
                className="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700"
              >
                Track Order
              </Link>
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className="rounded-full bg-[#0B0B0D] px-3.5 py-1.5 text-xs font-semibold text-white"
              >
                {isAuthenticated ? "My Account" : "Sign In"}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full border border-[#0B0B0D] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
