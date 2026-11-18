"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { DialogModal } from "./DialogModal";
import { useStore } from "@/components/providers/StoreProvider";
import {
  FREE_DELIVERY_THRESHOLD_LKR,
  STANDARD_DELIVERY_FEE_LKR,
  calculateDeliveryFee,
  formatLKR,
} from "@/lib/constants";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeCartItem,
    clearCart,
  } = useStore();

  const items = cart?.items ?? [];
  const subtotal = parseFloat(cart?.subtotal ?? "0") || 0;
  const deliveryFee =
    items.length > 0 ? calculateDeliveryFee(subtotal) : 0;
  const grandTotal = subtotal + deliveryFee;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD_LKR - subtotal);
  const progressPct = Math.min(
    100,
    (subtotal / FREE_DELIVERY_THRESHOLD_LKR) * 100
  );

  return (
    <DialogModal
      open={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      title={`Your Cart (${cart?.total_items_count ?? 0})`}
      variant="drawer"
    >
      <div className="flex flex-col h-full justify-between">
        <div className="p-5 space-y-4">
          {/* Free Delivery Progress Banner */}
          <div className="rounded-xl bg-[#F4F5F7] p-3.5 border border-neutral-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0B0B0D]">
              <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
              {items.length === 0 ? (
                <span>
                  Free Islandwide Delivery on orders{" "}
                  {formatLKR(FREE_DELIVERY_THRESHOLD_LKR)}+
                </span>
              ) : remainingForFree === 0 ? (
                <span className="text-emerald-700">
                  Unlocked! Free Islandwide Delivery applied.
                </span>
              ) : (
                <span>
                  Add{" "}
                  <strong className="tabular-nums">
                    {formatLKR(remainingForFree)}
                  </strong>{" "}
                  more for Free Delivery (otherwise{" "}
                  {formatLKR(STANDARD_DELIVERY_FEE_LKR)})
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full bg-[#0B0B0D] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F5F7] text-neutral-500">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="font-semibold text-[#0B0B0D]">Your cart is empty</p>
              <p className="mt-1 text-xs text-neutral-500">
                Explore electric cycles, batteries, and accessories.
              </p>
              <Link
                href="/shop"
                onClick={() => setIsCartOpen(false)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Browse Storefront
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <div key={item.id} className="py-3.5 flex gap-3.5">
                    <Link
                      href={`/products/${item.product_slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="h-20 w-20 shrink-0 rounded-xl bg-[#F4F5F7] border border-neutral-200 overflow-hidden flex items-center justify-center"
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          width={80}
                          height={80}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-neutral-400" />
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.product_slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-sm font-semibold text-[#0B0B0D] hover:underline line-clamp-2 leading-snug"
                        >
                          {item.product_name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          aria-label={`Remove ${item.product_name}`}
                          className="text-neutral-400 hover:text-red-600 p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.variant_name && (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                          {item.variant_name}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="p-1.5 text-neutral-600 hover:text-[#0B0B0D]"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="p-1.5 text-neutral-600 hover:text-[#0B0B0D]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-[#0B0B0D] tabular-nums">
                          {formatLKR(item.line_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-neutral-500 hover:text-red-600 underline underline-offset-2"
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-200 bg-[#F4F5F7] p-5 space-y-3 shrink-0">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#0B0B0D] tabular-nums">
                  {formatLKR(subtotal, true)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-[#0B0B0D] tabular-nums">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700">Free</span>
                  ) : (
                    formatLKR(deliveryFee, true)
                  )}
                </span>
              </div>
              {cart?.max_lead_time_days ? (
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Estimated Dispatch</span>
                  <span>Within {cart.max_lead_time_days} business day(s)</span>
                </div>
              ) : null}
              <div className="pt-2 border-t border-neutral-200 flex justify-between text-base font-extrabold text-[#0B0B0D]">
                <span>Estimated Total</span>
                <span className="tabular-nums">{formatLKR(grandTotal, true)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-[#0B0B0D] bg-white px-4 py-2.5 text-xs font-semibold text-[#0B0B0D] hover:bg-neutral-100 transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0B0B0D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
              >
                Checkout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DialogModal>
  );
}
