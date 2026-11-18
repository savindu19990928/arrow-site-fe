"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { ApiError, promotionsApi } from "@/lib/api";
import {
  FREE_DELIVERY_THRESHOLD_LKR,
  STANDARD_DELIVERY_FEE_LKR,
  calculateDeliveryFee,
  formatLKR,
} from "@/lib/constants";
import type { CouponValidationResponse } from "@/lib/types";

export default function CartPage() {
  const {
    cart,
    isCartLoading,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    notify,
  } = useStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponData, setCouponData] = useState<CouponValidationResponse | null>(
    null
  );
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const items = cart?.items ?? [];
  const rawSubtotal = parseFloat(cart?.subtotal ?? "0") || 0;
  const discountAmount = couponData?.valid ? couponData.discount_amount : 0;
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const deliveryFee =
    items.length > 0 ? calculateDeliveryFee(discountedSubtotal) : 0;
  const grandTotal = discountedSubtotal + deliveryFee;
  const remainingForFree = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD_LKR - discountedSubtotal
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const res = await promotionsApi.validateCoupon(code, rawSubtotal);
      setCouponData(res);
      notify({
        type: res.valid ? "success" : "error",
        title: res.valid ? `Coupon ${res.code} applied` : "Invalid coupon",
        message: res.message,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Coupon code could not be validated.";
      setCouponData(null);
      notify({ type: "error", title: "Coupon Invalid", message: msg });
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            SHOPPING BAG
          </p>
          <h1 className="font-display-italic text-3xl sm:text-4xl text-[#0B0B0D] mt-1">
            Your Shopping Cart
          </h1>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold text-[#0B0B0D] hover:underline underline-offset-4"
        >
          ← Continue Shopping
        </Link>
      </div>

      {isCartLoading && items.length === 0 ? (
        <div className="py-16 text-center text-sm text-neutral-500">
          Loading your cart...
        </div>
      ) : items.length === 0 ? (
        <div className="my-12 rounded-2xl border border-neutral-200 bg-[#F4F5F7] py-16 px-6 text-center max-w-xl mx-auto">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl text-[#0B0B0D]">
            Your cart is currently empty
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600">
            Discover electric mountain bikes, commuter e-cycles, batteries, and
            genuine Shimano & Kenda gear.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800"
          >
            Explore Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Line Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free delivery threshold notice */}
            <div className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-4 flex items-center gap-3">
              <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 text-xs sm:text-sm font-medium text-[#0B0B0D]">
                {remainingForFree === 0 ? (
                  <span className="text-emerald-700 font-semibold">
                    Your order qualifies for Free Islandwide Delivery (Rs. 100,000+)!
                  </span>
                ) : (
                  <span>
                    Add{" "}
                    <strong className="tabular-nums">
                      {formatLKR(remainingForFree)}
                    </strong>{" "}
                    more to unlock Free Islandwide Delivery (otherwise{" "}
                    {formatLKR(STANDARD_DELIVERY_FEE_LKR)}).
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-200 overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <Link
                    href={`/products/${item.product_slug}`}
                    className="h-24 w-28 shrink-0 rounded-xl bg-[#F4F5F7] border border-neutral-200 overflow-hidden flex items-center justify-center p-2"
                  >
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-neutral-400" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product_slug}`}
                      className="text-sm sm:text-base font-bold text-[#0B0B0D] hover:underline"
                    >
                      {item.product_name}
                    </Link>
                    {item.variant_name && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Variant: {item.variant_name}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-neutral-400 mt-1">
                      SKU: {item.variant_sku || item.product_sku} · Unit:{" "}
                      {formatLKR(item.unit_price, true)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="p-2 text-neutral-600 hover:text-[#0B0B0D]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="p-2 text-neutral-600 hover:text-[#0B0B0D]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-sm sm:text-base font-extrabold text-[#0B0B0D] tabular-nums w-28 text-right">
                      {formatLKR(item.line_total, true)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeCartItem(item.id)}
                      aria-label={`Remove ${item.product_name}`}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-neutral-500 hover:text-red-600 underline underline-offset-2"
              >
                Clear Entire Cart
              </button>
              {cart?.max_lead_time_days ? (
                <p className="text-xs text-neutral-500">
                  Estimated dispatch lead time:{" "}
                  <strong>{cart.max_lead_time_days} business day(s)</strong>
                </p>
              ) : null}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-6 space-y-5 sticky top-28">
            <h2 className="font-display text-2xl text-[#0B0B0D]">
              Order Summary
            </h2>

            {/* Coupon Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label
                htmlFor="cart-coupon"
                className="block text-xs font-bold text-[#0B0B0D]"
              >
                Promo / Coupon Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    id="cart-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. ARROW10"
                    className="w-full rounded-full border border-neutral-300 bg-white pl-9 pr-3 py-2 text-xs uppercase font-mono focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-40"
                >
                  {validatingCoupon ? "..." : "Apply"}
                </button>
              </div>
              {couponData?.valid && (
                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold pt-1">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {couponData.code} (-{formatLKR(couponData.discount_amount)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponData(null);
                      setCouponInput("");
                    }}
                    className="text-neutral-500 hover:text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-2.5 pt-3 border-t border-neutral-200 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({cart?.total_items_count ?? 0} items)</span>
                <span className="font-semibold text-[#0B0B0D] tabular-nums">
                  {formatLKR(rawSubtotal, true)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount</span>
                  <span className="font-semibold tabular-nums">
                    -{formatLKR(discountAmount, true)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-[#0B0B0D] tabular-nums">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700">Free</span>
                  ) : (
                    formatLKR(deliveryFee, true)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-300 flex justify-between text-base font-extrabold text-[#0B0B0D]">
                <span>Total</span>
                <span className="tabular-nums">{formatLKR(grandTotal, true)}</span>
              </div>
            </div>

            <Link
              href={
                couponData?.valid
                  ? `/checkout?coupon=${encodeURIComponent(couponData.code)}`
                  : "/checkout"
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0B0D] py-3.5 px-6 text-sm font-bold text-white hover:bg-neutral-800 transition-colors"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-[11px] text-center text-neutral-500">
              Bank Transfer · Koko BNPL · Mintpay 3 Installments
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
