"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Tag,
  Wallet,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import {
  ApiError,
  addressApi,
  getOrCreateGuestToken,
  ordersApi,
  paymentsApi,
  promotionsApi,
} from "@/lib/api";
import {
  FREE_DELIVERY_THRESHOLD_LKR,
  SRI_LANKA_PROVINCES,
  STANDARD_DELIVERY_FEE_LKR,
  calculateDeliveryFee,
  formatLKR,
} from "@/lib/constants";
import type {
  Address,
  BankDetailsResponse,
  CouponValidationResponse,
  InitiatePaymentResponse,
  OrderDetail,
  PaymentMethod,
} from "@/lib/types";
import { BankSlipUploadCard } from "@/components/payments/BankSlipUploadCard";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated, cart, refreshCart, notify } = useStore();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [bankDetails, setBankDetails] = useState<BankDetailsResponse | null>(null);

  // Guest / Contact fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Shipping fields
  const [recipientName, setRecipientName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Western Province");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Coupon & Payment
  const [couponInput, setCouponInput] = useState(
    searchParams.get("coupon") ?? ""
  );
  const [couponData, setCouponData] = useState<CouponValidationResponse | null>(
    null
  );
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [agreePolicies, setAgreePolicies] = useState(true);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderDetail | null>(null);
  const [initiatedPayment, setInitiatedPayment] =
    useState<InitiatePaymentResponse | null>(null);

  const items = cart?.items ?? [];
  const rawSubtotal = parseFloat(cart?.subtotal ?? "0") || 0;
  const discountAmount = couponData?.valid ? couponData.discount_amount : 0;
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const deliveryFee =
    items.length > 0 ? calculateDeliveryFee(discountedSubtotal) : 0;
  const grandTotal = discountedSubtotal + deliveryFee;

  const applySavedAddress = (addr: Address) => {
    setRecipientName(addr.recipient_name);
    setShippingPhone(addr.phone_number);
    setAddress1(addr.address_line1);
    setAddress2(addr.address_line2 ?? "");
    setCity(addr.city);
    setProvince(addr.state_or_province || "Western Province");
    setPostalCode(addr.postal_code);
    setDeliveryNotes(addr.delivery_notes ?? "");
  };

  // Load saved addresses for authenticated user + bank details
  useEffect(() => {
    paymentsApi
      .getBankDetails()
      .then(setBankDetails)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    addressApi
      .list()
      .then((list) => {
        setSavedAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) {
          setSelectedAddressId(def.id);
          setRecipientName(def.recipient_name);
          setShippingPhone(def.phone_number);
          setAddress1(def.address_line1);
          setAddress2(def.address_line2 ?? "");
          setCity(def.city);
          setProvince(def.state_or_province || "Western Province");
          setPostalCode(def.postal_code);
          setDeliveryNotes(def.delivery_notes ?? "");
        } else if (user) {
          setRecipientName((prev) =>
            prev || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
          );
          setShippingPhone((prev) => prev || user.phone_number || "");
        }
      })
      .catch(() => {});
  }, [isAuthenticated, user]);

  // Auto-validate coupon from query param
  useEffect(() => {
    const initialCoupon = searchParams.get("coupon");
    if (initialCoupon && rawSubtotal > 0 && !couponData) {
      promotionsApi
        .validateCoupon(initialCoupon, rawSubtotal)
        .then((res) => {
          if (res.valid) setCouponData(res);
        })
        .catch(() => {});
    }
  }, [searchParams, rawSubtotal, couponData]);

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
      setCouponData(null);
      notify({
        type: "error",
        title: "Coupon invalid",
        message:
          err instanceof ApiError ? err.message : "Could not validate coupon.",
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      notify({ type: "error", title: "Your cart is empty" });
      return;
    }
    if (!agreePolicies) {
      notify({
        type: "error",
        title: "Accept policies to continue",
        message: "Please review and accept our Terms, Privacy, and Return Policies.",
      });
      return;
    }

    setPlacingOrder(true);
    try {
      const guestToken = !isAuthenticated ? getOrCreateGuestToken() : undefined;
      const order = await ordersApi.checkout({
        ...(isAuthenticated
          ? {}
          : {
              guest_name: guestName.trim() || recipientName.trim(),
              guest_email: guestEmail.trim(),
              guest_phone: guestPhone.trim() || shippingPhone.trim(),
              guest_token: guestToken,
            }),
        shipping_recipient_name: recipientName.trim(),
        shipping_phone: shippingPhone.trim(),
        shipping_address_line1: address1.trim(),
        shipping_address_line2: address2.trim() || undefined,
        shipping_city: city.trim(),
        shipping_state: province,
        shipping_postal_code: postalCode.trim(),
        shipping_country: "Sri Lanka",
        payment_method: paymentMethod,
        coupon_code: couponData?.valid ? couponData.code : undefined,
        delivery_notes: deliveryNotes.trim() || undefined,
      });

      setCreatedOrder(order);
      await refreshCart();

      // For KOKO or MINTPAY, initiate gateway checkout session right away
      if (paymentMethod === "KOKO" || paymentMethod === "MINTPAY") {
        try {
          const payRes = await paymentsApi.initiate({
            order_number: order.order_number,
            payment_method: paymentMethod,
            contact: isAuthenticated
              ? undefined
              : guestEmail.trim() || guestPhone.trim(),
          });
          setInitiatedPayment(payRes);
        } catch (payErr) {
          notify({
            type: "info",
            title: "Order Placed — Payment Pending",
            message:
              payErr instanceof ApiError
                ? payErr.message
                : "You can initiate payment from your order view.",
          });
        }
      }

      notify({
        type: "success",
        title: `Order ${order.order_number} Placed`,
        message:
          paymentMethod === "BANK_TRANSFER"
            ? "Upload your bank transfer slip below to complete verification."
            : `Proceed to ${paymentMethod} to complete payment.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Checkout failed",
        message:
          err instanceof ApiError
            ? err.message
            : "Please verify your details and try again.",
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!createdOrder) return;
    try {
      const contact = !isAuthenticated
        ? guestEmail.trim() || guestPhone.trim() || shippingPhone.trim()
        : undefined;
      const { blob, filename } = await ordersApi.downloadInvoice(
        createdOrder.id,
        contact
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Invoice_${createdOrder.order_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify({
        type: "error",
        title: "Invoice unavailable",
        message:
          err instanceof ApiError ? err.message : "Could not download PDF invoice.",
      });
    }
  };

  // Post-Checkout Order Created View
  if (createdOrder) {
    const latestPayment = createdOrder.payments?.[0];
    return (
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-10 space-y-6">
        <div className="rounded-2xl bg-[#0B0B0D] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 text-amber-300 px-3 py-0.5 text-[11px] font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Status: {createdOrder.status} · Payment: {createdOrder.payment_status}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl">
              Order {createdOrder.order_number}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              Total Payable:{" "}
              <strong className="text-white tabular-nums">
                {formatLKR(createdOrder.total_amount, true)}
              </strong>{" "}
              · Orders remain pending until payment verification is confirmed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0B0B0D] hover:bg-neutral-200"
            >
              <Download className="h-3.5 w-3.5" />
              PDF Invoice
            </button>
            <Link
              href={`/track-order?order_number=${encodeURIComponent(
                createdOrder.order_number
              )}&contact=${encodeURIComponent(
                createdOrder.customer_contact || guestEmail || shippingPhone
              )}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Track Order
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Payment Action Area */}
        {createdOrder.payment_method === "BANK_TRANSFER" ? (
          <BankSlipUploadCard
            orderNumber={createdOrder.order_number}
            amount={createdOrder.total_amount}
            guestContact={
              !isAuthenticated
                ? guestEmail.trim() || guestPhone.trim() || shippingPhone.trim()
                : undefined
            }
            bankDetails={createdOrder.bank_transfer_details ?? bankDetails}
            existingSlipUrl={latestPayment?.bank_slip_image}
            existingReference={latestPayment?.customer_bank_reference}
            paymentStatus={createdOrder.payment_status}
          />
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-2xl text-[#0B0B0D]">
              Complete {createdOrder.payment_method} Payment
            </h2>
            {initiatedPayment ? (
              <div className="space-y-3 text-sm text-neutral-700">
                <p>{initiatedPayment.message}</p>
                {initiatedPayment.installments && (
                  <p className="rounded-xl bg-[#F4F5F7] p-3 text-xs font-semibold text-[#0B0B0D]">
                    Installment Plan: {initiatedPayment.installments} payments of{" "}
                    <span className="tabular-nums">
                      {formatLKR(initiatedPayment.installment_amount, true)}
                    </span>
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {initiatedPayment.checkout_url && (
                    <a
                      href={initiatedPayment.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-6 py-3 text-xs font-bold text-white hover:bg-neutral-800"
                    >
                      Continue to {initiatedPayment.provider} Gateway
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Link
                    href={isAuthenticated ? "/account" : "/track-order"}
                    className="rounded-full border border-neutral-300 px-5 py-3 text-xs font-semibold text-[#0B0B0D] hover:bg-[#F4F5F7]"
                  >
                    View Order Status
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-600">
                Your order has been reserved in PENDING state. Visit{" "}
                <Link href="/track-order" className="font-bold underline">
                  Order Tracking
                </Link>{" "}
                or{" "}
                <Link href="/account" className="font-bold underline">
                  Customer Portal
                </Link>{" "}
                to check verification status.
              </p>
            )}
          </div>
        )}

        {/* Itemized Order Breakdown */}
        <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-6 space-y-3">
          <h3 className="font-display text-lg text-[#0B0B0D]">Items Ordered</h3>
          <div className="divide-y divide-neutral-200 text-xs">
            {createdOrder.items.map((it) => (
              <div key={it.id} className="py-2.5 flex justify-between gap-4">
                <div>
                  <p className="font-bold text-[#0B0B0D]">
                    {it.product_name} × {it.quantity}
                  </p>
                  {it.variant_name && (
                    <p className="text-neutral-500">{it.variant_name}</p>
                  )}
                  {it.warranty_snapshot && (
                    <p className="text-emerald-700 font-medium">
                      Warranty: {it.warranty_snapshot}
                    </p>
                  )}
                </div>
                <span className="font-bold text-[#0B0B0D] tabular-nums shrink-0">
                  {formatLKR(it.total_price, true)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            SECURE CHECKOUT
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[#0B0B0D] mt-1">
            Delivery & Payment
          </h1>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-neutral-600">
            Checking out as a <strong>Guest</strong>. Already have an account?{" "}
            <Link
              href="/login?redirect=/checkout"
              className="font-bold text-[#0B0B0D] underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="my-12 rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-12 text-center max-w-lg mx-auto">
          <p className="font-display text-2xl text-[#0B0B0D]">
            Your cart is empty
          </p>
          <p className="mt-1.5 text-xs text-neutral-600">
            Add products to your cart before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-6 py-3 text-xs font-bold text-white"
          >
            Shop Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handlePlaceOrder}
          className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Checkout Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Guest Contact */}
            {!isAuthenticated && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
                <h2 className="font-display text-xl text-[#0B0B0D]">
                  Guest Contact Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        if (!recipientName) setRecipientName(e.target.value);
                      }}
                      placeholder="e.g. Kamal Silva"
                      className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="kamal@example.com"
                      className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        if (!shippingPhone) setShippingPhone(e.target.value);
                      }}
                      placeholder="+94771234567"
                      className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Saved Addresses Picker for Authenticated Customer */}
            {isAuthenticated && savedAddresses.length > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-3">
                <h2 className="font-display text-xl text-[#0B0B0D] flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Saved Delivery Addresses
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const active = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          applySavedAddress(addr);
                        }}
                        className={`rounded-xl border p-3.5 text-left text-xs transition-all ${
                          active
                            ? "border-[#0B0B0D] bg-[#F4F5F7] ring-1 ring-[#0B0B0D]"
                            : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#0B0B0D]">
                            {addr.recipient_name}
                          </span>
                          {addr.is_default && (
                            <span className="rounded-full bg-[#0B0B0D] text-white px-2 py-0.5 text-[10px] font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-600 mt-1">
                          {addr.address_line1}
                          {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                        </p>
                        <p className="text-neutral-600">
                          {addr.city}, {addr.postal_code}
                        </p>
                        <p className="text-neutral-500 mt-0.5">{addr.phone_number}</p>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId("new")}
                    className={`rounded-xl border border-dashed p-3.5 text-left text-xs font-semibold ${
                      selectedAddressId === "new"
                        ? "border-[#0B0B0D] bg-[#F4F5F7]"
                        : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    + Enter a Different Delivery Address
                  </button>
                </div>
              </section>
            )}

            {/* Shipping Details */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-xl text-[#0B0B0D]">
                Delivery Address (Sri Lanka)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Recipient Name *
                  </label>
                  <input
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient full name"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Delivery Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="+94771234567"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Street Address Line 1 *
                  </label>
                  <input
                    required
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="No. 45, Flower Road"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Apartment / Landmark (Optional)
                  </label>
                  <input
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Apt 3B / Near Town Hall"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    City *
                  </label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo 07"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Province
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  >
                    {SRI_LANKA_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Postal Code *
                  </label>
                  <input
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="00700"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Country
                  </label>
                  <input
                    disabled
                    value="Sri Lanka"
                    className="w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3.5 py-2.5 text-sm text-neutral-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                    Delivery Notes
                  </label>
                  <input
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Call before arrival, preferred delivery hours..."
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Payment Method Selection */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-xl text-[#0B0B0D]">
                Select Payment Option
              </h2>

              <div className="space-y-3">
                {/* Bank Transfer */}
                <label
                  className={`flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-[#0B0B0D] bg-[#F4F5F7] ring-1 ring-[#0B0B0D]"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    className="mt-1 accent-[#0B0B0D]"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#0B0B0D] inline-flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Direct Bank Transfer & Slip Upload
                      </span>
                      <span className="rounded-full bg-white border border-neutral-300 px-2.5 py-0.5 text-[10px] font-bold">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-neutral-600 mt-1 leading-relaxed">
                      Transfer directly to Arrow Ventures (Commercial Bank of
                      Ceylon) and upload your deposit slip immediately on the next
                      step. Orders remain <strong>Pending</strong> until our team
                      verifies payment.
                    </p>
                  </div>
                </label>

                {/* Koko BNPL */}
                <label
                  className={`flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                    paymentMethod === "KOKO"
                      ? "border-[#0B0B0D] bg-[#F4F5F7] ring-1 ring-[#0B0B0D]"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === "KOKO"}
                    onChange={() => setPaymentMethod("KOKO")}
                    className="mt-1 accent-[#0B0B0D]"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#0B0B0D] inline-flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Koko (Buy Now, Pay Later)
                      </span>
                      <span className="rounded-full bg-[#0B0B0D] text-white px-2.5 py-0.5 text-[10px] font-bold tabular-nums">
                        3 × {formatLKR(grandTotal / 3)}
                      </span>
                    </div>
                    <p className="text-neutral-600 mt-1">
                      Pay in 3 interest-free installments via Koko checkout gateway.
                    </p>
                  </div>
                </label>

                {/* Mintpay BNPL */}
                <label
                  className={`flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all ${
                    paymentMethod === "MINTPAY"
                      ? "border-[#0B0B0D] bg-[#F4F5F7] ring-1 ring-[#0B0B0D]"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === "MINTPAY"}
                    onChange={() => setPaymentMethod("MINTPAY")}
                    className="mt-1 accent-[#0B0B0D]"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#0B0B0D] inline-flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Mintpay (3 Monthly Installments)
                      </span>
                      <span className="rounded-full bg-[#0B0B0D] text-white px-2.5 py-0.5 text-[10px] font-bold tabular-nums">
                        3 × {formatLKR(grandTotal / 3)}
                      </span>
                    </div>
                    <p className="text-neutral-600 mt-1">
                      Split your total across 3 monthly payments with Mintpay.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Right Order Summary */}
          <aside className="lg:col-span-5 rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-6 space-y-5 sticky top-28">
            <h2 className="font-display text-2xl text-[#0B0B0D]">
              Order Summary
            </h2>

            <div className="divide-y divide-neutral-200 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#0B0B0D] truncate">
                      {item.product_name}
                    </p>
                    <p className="text-neutral-500">
                      Qty: {item.quantity}
                      {item.variant_name ? ` · ${item.variant_name}` : ""}
                    </p>
                  </div>
                  <span className="font-bold text-[#0B0B0D] tabular-nums shrink-0">
                    {formatLKR(item.line_total, true)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Input */}
            <div className="flex gap-2 pt-2 border-t border-neutral-200">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo code (e.g. ARROW10)"
                  className="w-full rounded-full border border-neutral-300 bg-white pl-9 pr-3 py-2 text-xs uppercase font-mono focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponInput.trim()}
                className="rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-40"
              >
                {validatingCoupon ? "..." : "Apply"}
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-neutral-200 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#0B0B0D] tabular-nums">
                  {formatLKR(rawSubtotal, true)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({couponData?.code})</span>
                  <span className="font-semibold tabular-nums">
                    -{formatLKR(discountAmount, true)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>
                  Delivery{" "}
                  <span className="text-[11px] text-neutral-400">
                    (Free ≥ {formatLKR(FREE_DELIVERY_THRESHOLD_LKR)})
                  </span>
                </span>
                <span className="font-semibold text-[#0B0B0D] tabular-nums">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700">Free</span>
                  ) : (
                    formatLKR(STANDARD_DELIVERY_FEE_LKR, true)
                  )}
                </span>
              </div>
              <div className="pt-3 border-t border-neutral-300 flex justify-between text-lg font-extrabold text-[#0B0B0D]">
                <span>Total Payable</span>
                <span className="tabular-nums">{formatLKR(grandTotal, true)}</span>
              </div>
            </div>

            {/* Policy Agreement Checkbox */}
            <label className="flex items-start gap-2.5 text-[11px] text-neutral-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreePolicies}
                onChange={(e) => setAgreePolicies(e.target.checked)}
                className="mt-0.5 accent-[#0B0B0D]"
              />
              <span>
                I agree to Arrow Ventures{" "}
                <Link
                  href="/policies/terms"
                  target="_blank"
                  className="font-bold text-[#0B0B0D] underline"
                >
                  Terms & Conditions
                </Link>
                ,{" "}
                <Link
                  href="/policies/returns"
                  target="_blank"
                  className="font-bold text-[#0B0B0D] underline"
                >
                  Refund & Return Policy
                </Link>
                , and{" "}
                <Link
                  href="/policies/privacy"
                  target="_blank"
                  className="font-bold text-[#0B0B0D] underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0B0D] py-3.5 px-6 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Place Order · {formatLKR(grandTotal)}
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Real-time stock reservation & PDF invoice issued on placement
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-12 text-center text-sm text-neutral-500">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
