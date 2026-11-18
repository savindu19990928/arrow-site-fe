"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { ApiError, ordersApi } from "@/lib/api";
import {
  ORDER_STATUS_STEPS,
  formatDateSL,
  formatDateTimeSL,
  formatLKR,
} from "@/lib/constants";
import type { OrderDetail } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { BankSlipUploadCard } from "@/components/payments/BankSlipUploadCard";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const { notify } = useStore();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("order_number") ?? ""
  );
  const [contact, setContact] = useState(searchParams.get("contact") ?? "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performLookup = useCallback(
    async (num: string, c: string) => {
      if (!num.trim() || !c.trim()) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await ordersApi.track(num.trim(), c.trim());
        setOrder(res);
      } catch (err) {
        setOrder(null);
        setErrorMsg(
          err instanceof ApiError
            ? err.message
            : "Order not found. Check your order number and checkout contact."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const num = searchParams.get("order_number");
    const c = searchParams.get("contact");
    if (!num || !c) return;
    let active = true;
    ordersApi
      .track(num.trim(), c.trim())
      .then((res) => {
        if (active) {
          setOrder(res);
          setErrorMsg(null);
        }
      })
      .catch((err) => {
        if (active) {
          setOrder(null);
          setErrorMsg(
            err instanceof ApiError
              ? err.message
              : "Order not found. Check your order number and checkout contact."
          );
        }
      });
    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(orderNumber, contact);
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const { blob, filename } = await ordersApi.downloadInvoice(
        order.id,
        contact.trim()
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Invoice_${order.order_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify({
        type: "error",
        title: "Could not download invoice",
        message: err instanceof ApiError ? err.message : "Try again shortly.",
      });
    }
  };

  const currentStepIdx = order
    ? ORDER_STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;
  const latestPayment = order?.payments?.[0];

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          ORDER TRACKING
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-[#0B0B0D] mt-1">
          Track Your Arrow Order
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600">
          Enter your order number (e.g. <span className="font-mono">ARW-...</span>)
          and the email or phone number submitted at checkout.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        <div className="sm:col-span-5">
          <label
            htmlFor="track-order-num"
            className="block text-[11px] font-bold uppercase text-neutral-500 mb-1"
          >
            Order Number
          </label>
          <input
            id="track-order-num"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ARW-20261028-9F3A1B"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-mono focus:border-[#0B0B0D] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-5">
          <label
            htmlFor="track-contact"
            className="block text-[11px] font-bold uppercase text-neutral-500 mb-1"
          >
            Email or Phone Number
          </label>
          <input
            id="track-contact"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="kamal@example.com or +9477..."
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B0B0D] py-2.5 px-4 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? "..." : "Track"}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 text-center">
          {errorMsg}
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl bg-[#0B0B0D] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-neutral-400">
                Placed {formatDateTimeSL(order.placed_at)}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl mt-0.5">
                {order.order_number}
              </h2>
              <p className="text-xs text-neutral-300 mt-1">
                Order Status: <strong className="text-white">{order.status}</strong>{" "}
                · Payment: <strong className="text-white">{order.payment_status}</strong>{" "}
                ({order.payment_method})
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#0B0B0D] hover:bg-neutral-200"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF Invoice
            </button>
          </div>

          {/* Visual Timeline */}
          {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h3 className="font-display text-lg text-[#0B0B0D] mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery Progress
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {ORDER_STATUS_STEPS.map((step, idx) => {
                  const done = currentStepIdx >= idx;
                  return (
                    <div
                      key={step.key}
                      className={`rounded-xl p-3 border text-center ${
                        done
                          ? "bg-[#0B0B0D] text-white border-[#0B0B0D]"
                          : "bg-[#F4F5F7] text-neutral-500 border-neutral-200"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 mx-auto mb-1 ${
                          done ? "text-emerald-400" : "text-neutral-300"
                        }`}
                      />
                      <p className="text-[11px] font-bold leading-tight">
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {(order.courier_name || order.tracking_number || order.estimated_arrival_date) && (
                <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Courier</span>
                    <strong className="text-[#0B0B0D]">
                      {order.courier_name || "Assigned on dispatch"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Tracking #</span>
                    <strong className="font-mono text-[#0B0B0D]">
                      {order.tracking_number || "Pending"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Estimated Arrival</span>
                    <strong className="text-[#0B0B0D]">
                      {formatDateSL(order.estimated_arrival_date)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer Upload/Resubmit if applicable */}
          {order.payment_method === "BANK_TRANSFER" &&
            order.payment_status !== "SUCCESSFUL" && (
              <BankSlipUploadCard
                orderNumber={order.order_number}
                amount={order.total_amount}
                guestContact={contact}
                bankDetails={order.bank_transfer_details}
                existingSlipUrl={latestPayment?.bank_slip_image}
                existingReference={latestPayment?.customer_bank_reference}
                paymentStatus={order.payment_status}
                adminNotes={latestPayment?.admin_notes}
                onSuccess={() => performLookup(order.order_number, contact)}
              />
            )}

          {/* Items & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <h3 className="font-display text-lg text-[#0B0B0D] flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items
              </h3>
              <div className="divide-y divide-neutral-200 text-xs">
                {(order.items ?? []).map((it) => (
                  <div key={it.id} className="py-2.5 flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#0B0B0D]">
                        {it.product_name} × {it.quantity}
                      </p>
                      {it.variant_name && (
                        <p className="text-neutral-500">{it.variant_name}</p>
                      )}
                    </div>
                    <span className="font-bold text-[#0B0B0D] tabular-nums">
                      {formatLKR(it.total_price, true)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-extrabold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatLKR(order.total_amount, true)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2 text-xs">
              <h3 className="font-display text-lg text-[#0B0B0D]">
                Delivery Destination
              </h3>
              <p className="font-bold text-[#0B0B0D]">
                {order.shipping_recipient_name}
              </p>
              <p className="text-neutral-600">
                {order.shipping_address_line1}
                {order.shipping_address_line2
                  ? `, ${order.shipping_address_line2}`
                  : ""}
              </p>
              <p className="text-neutral-600">
                {order.shipping_city}, {order.shipping_state}{" "}
                {order.shipping_postal_code}
              </p>
              <p className="text-neutral-600">{order.shipping_phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-neutral-500">
          Loading order tracking...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
