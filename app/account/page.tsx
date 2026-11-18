"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Check,
  CheckCircle2,
  Download,
  Heart,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import {
  ApiError,
  addressApi,
  authApi,
  notificationsApi,
  ordersApi,
} from "@/lib/api";
import {
  ORDER_STATUS_STEPS,
  SRI_LANKA_PROVINCES,
  formatDateSL,
  formatDateTimeSL,
  formatLKR,
} from "@/lib/constants";
import type {
  Address,
  AddressPayload,
  CustomerNotification,
  OrderDetail,
  OrderListItem,
} from "@/lib/types";
import { DialogModal } from "@/components/ui/DialogModal";
import { BankSlipUploadCard } from "@/components/payments/BankSlipUploadCard";
import { ProductCard } from "@/components/ui/ProductCard";

type AccountTab =
  | "orders"
  | "addresses"
  | "wishlist"
  | "notifications"
  | "profile";

function AccountPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isAuthenticated,
    isAdmin,
    isLoadingAuth,
    wishlistItems,
    refreshProfile,
    notify,
    logout,
  } = useStore();

  const paramTab = searchParams.get("tab") as AccountTab | null;
  const [selectedTab, setSelectedTab] = useState<AccountTab | null>(null);
  const activeTab: AccountTab =
    selectedTab ??
    (paramTab &&
    ["orders", "addresses", "wishlist", "notifications", "profile"].includes(
      paramTab
    )
      ? paramTab
      : "orders");

  const setActiveTab = (tab: AccountTab) => {
    setSelectedTab(tab);
    router.replace(`/account?tab=${tab}`, { scroll: false });
  };

  // Orders
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Cancel / Return Modals
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [returnOrder, setReturnOrder] = useState<OrderDetail | null>(null);
  const [returnType, setReturnType] = useState<
    "RETURN_AND_REFUND" | "REFUND_ONLY"
  >("RETURN_AND_REFUND");
  const [returnReason, setReturnReason] = useState("");
  const [returnBankDetails, setReturnBankDetails] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrForm, setAddrForm] = useState<AddressPayload>({
    recipient_name: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_or_province: "Western Province",
    postal_code: "",
    country: "Sri Lanka",
    is_default: false,
    delivery_notes: "",
  });

  // Notifications
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile & Password
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const effectiveFirstName = firstName ?? user?.first_name ?? "";
  const effectiveLastName = lastName ?? user?.last_name ?? "";
  const effectivePhone = phone ?? user?.phone_number ?? "";

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/account");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await ordersApi.list();
      setOrders(res.results ?? []);
    } catch {
      // handled silently
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const list = await addressApi.list();
      setAddresses(list);
    } catch {
      // ignore
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.notifications ?? []);
      setUnreadCount(res.unread_count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.all([
      ordersApi.list().catch(() => ({ results: [] as OrderListItem[] })),
      addressApi.list().catch(() => [] as Address[]),
      notificationsApi
        .list()
        .catch(() => ({ notifications: [] as CustomerNotification[], unread_count: 0 })),
    ])
      .then(([ordRes, addrList, notifRes]) => {
        if (!active) return;
        setOrders(ordRes.results ?? []);
        setAddresses(addrList);
        setNotifications(notifRes.notifications ?? []);
        setUnreadCount(notifRes.unread_count ?? 0);
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const openOrderDetail = async (id: number) => {
    try {
      const detail = await ordersApi.getDetail(id);
      setSelectedOrder(detail);
      setOrderModalOpen(true);
    } catch (err) {
      notify({
        type: "error",
        title: "Unable to load order",
        message: err instanceof ApiError ? err.message : "Try again.",
      });
    }
  };

  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
    try {
      const { blob, filename } = await ordersApi.downloadInvoice(orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Invoice_${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify({
        type: "error",
        title: "Invoice unavailable",
        message: err instanceof ApiError ? err.message : "Failed to fetch PDF.",
      });
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrderId || !cancelReason.trim()) return;
    setSubmittingAction(true);
    try {
      await ordersApi.cancelOrder(cancelOrderId, cancelReason.trim());
      notify({
        type: "success",
        title: "Cancellation requested",
        message: "Our team has received your cancellation request.",
      });
      setCancelOrderId(null);
      setCancelReason("");
      setOrderModalOpen(false);
      await loadOrders();
    } catch (err) {
      notify({
        type: "error",
        title: "Cancellation failed",
        message: err instanceof ApiError ? err.message : "Unable to cancel order.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReturnRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;
    setSubmittingAction(true);
    try {
      await ordersApi.requestReturnRefund(returnOrder.id, {
        type: returnType,
        refund_amount: returnOrder.total_amount,
        reason: returnReason.trim(),
        bank_details_for_refund: returnBankDetails.trim(),
      });
      notify({
        type: "success",
        title: "Return / Refund request submitted",
        message: "We will inspect and update your request status shortly.",
      });
      setReturnOrder(null);
      setReturnReason("");
      setReturnBankDetails("");
      setOrderModalOpen(false);
      await loadOrders();
    } catch (err) {
      notify({
        type: "error",
        title: "Request failed",
        message: err instanceof ApiError ? err.message : "Could not submit request.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const openNewAddressModal = () => {
    setEditingAddress(null);
    setAddrForm({
      recipient_name: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim(),
      phone_number: user?.phone_number || "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_or_province: "Western Province",
      postal_code: "",
      country: "Sri Lanka",
      is_default: addresses.length === 0,
      delivery_notes: "",
    });
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: Address) => {
    setEditingAddress(addr);
    setAddrForm({
      recipient_name: addr.recipient_name,
      phone_number: addr.phone_number,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? "",
      city: addr.city,
      state_or_province: addr.state_or_province ?? "Western Province",
      postal_code: addr.postal_code,
      country: addr.country || "Sri Lanka",
      is_default: addr.is_default,
      delivery_notes: addr.delivery_notes ?? "",
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      if (editingAddress) {
        await addressApi.update(editingAddress.id, addrForm);
        notify({ type: "success", title: "Address updated" });
      } else {
        await addressApi.create(addrForm);
        notify({ type: "success", title: "Address added" });
      }
      setAddressModalOpen(false);
      await loadAddresses();
    } catch (err) {
      notify({
        type: "error",
        title: "Address save failed",
        message: err instanceof ApiError ? err.message : "Please verify fields.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await addressApi.remove(id);
      notify({ type: "info", title: "Address deleted" });
      await loadAddresses();
    } catch (err) {
      notify({
        type: "error",
        title: "Delete failed",
        message: err instanceof ApiError ? err.message : "Error removing address.",
      });
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressApi.setDefault(id);
      notify({ type: "success", title: "Default delivery address updated" });
      await loadAddresses();
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfile({
        first_name: effectiveFirstName.trim(),
        last_name: effectiveLastName.trim(),
        phone_number: effectivePhone.trim(),
      });
      await refreshProfile();
      notify({ type: "success", title: "Profile updated" });
    } catch (err) {
      notify({
        type: "error",
        title: "Update failed",
        message: err instanceof ApiError ? err.message : "Could not save profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify({ type: "error", title: "New passwords do not match" });
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify({ type: "success", title: "Password updated successfully" });
    } catch (err) {
      notify({
        type: "error",
        title: "Password change failed",
        message: err instanceof ApiError ? err.message : "Check current password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-neutral-500">
        Loading customer portal...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            CUSTOMER PORTAL
          </p>
          <h1 className="font-display-italic text-3xl sm:text-4xl text-[#0B0B0D] mt-1">
            Hello, {user?.first_name || user?.email}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">{user?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Open Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-neutral-300 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-[#F4F5F7]"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <aside className="lg:col-span-3 space-y-1.5">
          {[
            { id: "orders", label: "Orders & Invoices", icon: Package },
            { id: "addresses", label: "Saved Addresses", icon: MapPin },
            {
              id: "wishlist",
              label: `Wishlist (${wishlistItems.length})`,
              icon: Heart,
            },
            {
              id: "notifications",
              label: `Notifications${unreadCount ? ` (${unreadCount})` : ""}`,
              icon: Bell,
            },
            { id: "profile", label: "Profile & Security", icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AccountTab)}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
                  active
                    ? "bg-[#0B0B0D] text-white"
                    : "bg-[#F4F5F7] text-[#0B0B0D] hover:bg-neutral-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9">
          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-[#0B0B0D]">
                  Order History & Tracking
                </h2>
                <Link
                  href="/shop"
                  className="text-xs font-bold text-[#0B0B0D] hover:underline"
                >
                  + New Order
                </Link>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-10 text-center">
                  <p className="font-display text-xl text-[#0B0B0D]">
                    No orders placed yet
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Your orders, PDF invoices, and bank slip submissions will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#0B0B0D]">
                            {ord.order_number}
                          </span>
                          <span className="rounded-full bg-[#0B0B0D] text-white px-2.5 py-0.5 text-[10px] font-bold">
                            {ord.status}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              ord.payment_status === "SUCCESSFUL"
                                ? "bg-emerald-100 text-emerald-800"
                                : ord.payment_status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {ord.payment_method} · {ord.payment_status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Placed {formatDateSL(ord.placed_at)} ·{" "}
                          {ord.items_count} item(s) · Est. Arrival{" "}
                          {formatDateSL(ord.estimated_arrival_date)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-extrabold text-[#0B0B0D] tabular-nums mr-2">
                          {formatLKR(ord.total_amount, true)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadInvoice(ord.id, ord.order_number)
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D] hover:bg-[#F4F5F7]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => openOrderDetail(ord.id)}
                          className="rounded-full bg-[#0B0B0D] px-4 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
                        >
                          Manage / Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-[#0B0B0D]">
                  Saved Delivery Addresses
                </h2>
                <button
                  type="button"
                  onClick={openNewAddressModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-10 text-center">
                  <p className="text-sm font-semibold text-[#0B0B0D]">
                    No saved addresses yet
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Save your home or office delivery address in Sri Lanka for
                    faster checkout.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`rounded-2xl border p-5 space-y-2 text-xs ${
                        addr.is_default
                          ? "border-[#0B0B0D] bg-[#F4F5F7]"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#0B0B0D]">
                          {addr.recipient_name}
                        </span>
                        {addr.is_default && (
                          <span className="rounded-full bg-[#0B0B0D] px-2.5 py-0.5 text-[10px] font-bold text-white">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-700">
                        {addr.address_line1}
                        {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                      </p>
                      <p className="text-neutral-700">
                        {addr.city}, {addr.state_or_province} {addr.postal_code}
                      </p>
                      <p className="text-neutral-500">{addr.phone_number}</p>
                      {addr.delivery_notes && (
                        <p className="italic text-neutral-500">
                          Note: {addr.delivery_notes}
                        </p>
                      )}

                      <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center gap-2">
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-semibold text-[#0B0B0D] hover:bg-neutral-100"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(addr)}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1 font-semibold text-[#0B0B0D]"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 font-semibold text-red-600 hover:bg-red-50 ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === "wishlist" && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-[#0B0B0D]">
                Saved Wishlist
              </h2>
              {wishlistItems.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-10 text-center">
                  <p className="text-sm font-semibold text-[#0B0B0D]">
                    Your wishlist is empty
                  </p>
                  <Link
                    href="/shop"
                    className="mt-4 inline-block rounded-full bg-[#0B0B0D] px-5 py-2 text-xs font-bold text-white"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistItems.map((item) => (
                    <ProductCard key={item.id} product={item.product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-[#0B0B0D]">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await notificationsApi.markAllRead();
                      await loadNotifications();
                      notify({ type: "info", title: "All notifications read" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D] hover:bg-[#F4F5F7]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark All Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-10 text-center text-xs text-neutral-500">
                  No notifications yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-2xl border p-4 flex items-start justify-between gap-4 ${
                        n.is_read
                          ? "border-neutral-200 bg-white"
                          : "border-[#0B0B0D] bg-[#F4F5F7]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!n.is_read && (
                            <span className="h-2 w-2 rounded-full bg-[#0B0B0D]" />
                          )}
                          <h3 className="text-sm font-bold text-[#0B0B0D]">
                            {n.title}
                          </h3>
                        </div>
                        <p className="text-xs text-neutral-600">{n.message}</p>
                        <p className="text-[11px] text-neutral-400">
                          {formatDateTimeSL(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={async () => {
                            await notificationsApi.markRead(n.id);
                            await loadNotifications();
                          }}
                          className="shrink-0 rounded-full bg-white border border-neutral-300 px-3 py-1 text-[11px] font-semibold hover:bg-neutral-100"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE & SECURITY TAB */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={handleSaveProfile}
                className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4"
              >
                <h2 className="font-display text-xl text-[#0B0B0D]">
                  Personal Profile
                </h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Email
                  </label>
                  <input
                    disabled
                    value={user?.email ?? ""}
                    className="w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3.5 py-2.5 text-sm text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    First Name
                  </label>
                  <input
                    required
                    value={effectiveFirstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Last Name
                  </label>
                  <input
                    required
                    value={effectiveLastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    value={effectivePhone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-full bg-[#0B0B0D] px-6 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </form>

              <form
                onSubmit={handleChangePassword}
                className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4"
              >
                <h2 className="font-display text-xl text-[#0B0B0D] flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-full bg-[#0B0B0D] px-6 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ORDER DETAIL MODAL */}
      <DialogModal
        open={orderModalOpen && Boolean(selectedOrder)}
        onClose={() => setOrderModalOpen(false)}
        title={`Order ${selectedOrder?.order_number ?? ""}`}
        maxWidthClass="max-w-3xl"
      >
        {selectedOrder && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F4F5F7] p-4 border border-neutral-200">
              <div className="text-xs space-y-1">
                <p>
                  Status:{" "}
                  <strong className="text-[#0B0B0D]">{selectedOrder.status}</strong>{" "}
                  · Payment:{" "}
                  <strong className="text-[#0B0B0D]">
                    {selectedOrder.payment_status}
                  </strong>
                </p>
                {selectedOrder.courier_name && (
                  <p>
                    Courier: <strong>{selectedOrder.courier_name}</strong> ·
                    Tracking:{" "}
                    <strong className="font-mono">
                      {selectedOrder.tracking_number}
                    </strong>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadInvoice(
                      selectedOrder.id,
                      selectedOrder.order_number
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-bold text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF Invoice
                </button>
                {(selectedOrder.status === "PENDING" ||
                  selectedOrder.status === "CONFIRMED") && (
                  <button
                    type="button"
                    onClick={() => setCancelOrderId(selectedOrder.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Request Cancellation
                  </button>
                )}
                {(selectedOrder.status === "DELIVERED" ||
                  selectedOrder.status === "IN_TRANSIT" ||
                  selectedOrder.status === "CONFIRMED") && (
                  <button
                    type="button"
                    onClick={() => setReturnOrder(selectedOrder)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-[#0B0B0D] hover:bg-neutral-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Return / Refund
                  </button>
                )}
              </div>
            </div>

            {/* Step Tracker */}
            {selectedOrder.status !== "CANCELLED" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {ORDER_STATUS_STEPS.map((st, idx) => {
                  const activeIdx = ORDER_STATUS_STEPS.findIndex(
                    (s) => s.key === selectedOrder.status
                  );
                  const done = activeIdx >= idx;
                  return (
                    <div
                      key={st.key}
                      className={`rounded-xl p-2 text-center border text-[10px] font-bold ${
                        done
                          ? "bg-[#0B0B0D] text-white border-[#0B0B0D]"
                          : "bg-neutral-50 text-neutral-400 border-neutral-200"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 mx-auto mb-1 ${
                          done ? "text-emerald-400" : "text-neutral-300"
                        }`}
                      />
                      {st.label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bank Slip Upload / Resubmit */}
            {selectedOrder.payment_method === "BANK_TRANSFER" &&
              selectedOrder.payment_status !== "SUCCESSFUL" && (
                <BankSlipUploadCard
                  orderNumber={selectedOrder.order_number}
                  amount={selectedOrder.total_amount}
                  bankDetails={selectedOrder.bank_transfer_details}
                  existingSlipUrl={selectedOrder.payments?.[0]?.bank_slip_image}
                  existingReference={
                    selectedOrder.payments?.[0]?.customer_bank_reference
                  }
                  paymentStatus={selectedOrder.payment_status}
                  adminNotes={selectedOrder.payments?.[0]?.admin_notes}
                  onSuccess={() => openOrderDetail(selectedOrder.id)}
                />
              )}

            {/* Items & Totals */}
            <div className="rounded-2xl border border-neutral-200 p-4 space-y-2 text-xs">
              {(selectedOrder.items ?? []).map((it) => (
                <div
                  key={it.id}
                  className="py-2 flex justify-between gap-4 border-b last:border-b-0 border-neutral-100"
                >
                  <div>
                    <p className="font-bold text-[#0B0B0D]">
                      {it.product_name} × {it.quantity}
                    </p>
                    {it.variant_name && (
                      <p className="text-neutral-500">{it.variant_name}</p>
                    )}
                    {it.warranty_snapshot && (
                      <p className="text-emerald-700">
                        Warranty: {it.warranty_snapshot}
                      </p>
                    )}
                  </div>
                  <span className="font-bold tabular-nums">
                    {formatLKR(it.total_price, true)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm">
                <span>Total Paid / Due</span>
                <span className="tabular-nums">
                  {formatLKR(selectedOrder.total_amount, true)}
                </span>
              </div>
            </div>

            {/* Status Timeline History */}
            {selectedOrder.status_history &&
              selectedOrder.status_history.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Status Timeline
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.status_history.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl bg-[#F4F5F7] px-3.5 py-2.5 text-xs flex justify-between gap-3"
                      >
                        <div>
                          <span className="font-bold text-[#0B0B0D]">
                            {h.status}
                          </span>
                          {h.note && (
                            <p className="text-neutral-600 mt-0.5">{h.note}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 shrink-0">
                          {formatDateTimeSL(h.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </DialogModal>

      {/* CANCELLATION MODAL */}
      <DialogModal
        open={Boolean(cancelOrderId)}
        onClose={() => setCancelOrderId(null)}
        title="Request Order Cancellation"
      >
        <form onSubmit={handleCancelOrder} className="p-5 space-y-4">
          <p className="text-xs text-neutral-600">
            Cancellation requests are accepted before an order is packed for
            courier handover.
          </p>
          <div>
            <label className="block text-xs font-bold mb-1">
              Reason for Cancellation *
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explain why you would like to cancel this order..."
              className="w-full rounded-xl border border-neutral-300 p-3 text-xs focus:border-[#0B0B0D] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelOrderId(null)}
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submittingAction ? "Submitting..." : "Submit Cancellation"}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* RETURN & REFUND MODAL */}
      <DialogModal
        open={Boolean(returnOrder)}
        onClose={() => setReturnOrder(null)}
        title={`Return / Refund (${returnOrder?.order_number ?? ""})`}
      >
        <form onSubmit={handleReturnRefund} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Request Type</label>
            <select
              value={returnType}
              onChange={(e) =>
                setReturnType(
                  e.target.value as "RETURN_AND_REFUND" | "REFUND_ONLY"
                )
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs"
            >
              <option value="RETURN_AND_REFUND">Return Product & Refund</option>
              <option value="REFUND_ONLY">Refund Only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              Reason / Defect Details *
            </label>
            <textarea
              required
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Describe the issue clearly..."
              className="w-full rounded-xl border border-neutral-300 p-3 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              Bank Details for Refund *
            </label>
            <input
              required
              value={returnBankDetails}
              onChange={(e) => setReturnBankDetails(e.target.value)}
              placeholder="Bank Name, Account Number, Account Holder Name"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReturnOrder(null)}
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="rounded-full bg-[#0B0B0D] px-5 py-2 text-xs font-bold text-white"
            >
              {submittingAction ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* ADDRESS FORM MODAL */}
      <DialogModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
      >
        <form onSubmit={handleSaveAddress} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Recipient Name *</label>
              <input
                required
                value={addrForm.recipient_name}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, recipient_name: e.target.value })
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input
                required
                value={addrForm.phone_number}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, phone_number: e.target.value })
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Address Line 1 *</label>
            <input
              required
              value={addrForm.address_line1}
              onChange={(e) =>
                setAddrForm({ ...addrForm, address_line1: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Address Line 2</label>
            <input
              value={addrForm.address_line2 ?? ""}
              onChange={(e) =>
                setAddrForm({ ...addrForm, address_line2: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">City *</label>
              <input
                required
                value={addrForm.city}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, city: e.target.value })
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Province</label>
              <select
                value={addrForm.state_or_province ?? "Western Province"}
                onChange={(e) =>
                  setAddrForm({
                    ...addrForm,
                    state_or_province: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                {SRI_LANKA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Postal Code *</label>
              <input
                required
                value={addrForm.postal_code}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, postal_code: e.target.value })
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Delivery Notes</label>
            <input
              value={addrForm.delivery_notes ?? ""}
              onChange={(e) =>
                setAddrForm({ ...addrForm, delivery_notes: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-300 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(addrForm.is_default)}
              onChange={(e) =>
                setAddrForm({ ...addrForm, is_default: e.target.checked })
              }
              className="accent-[#0B0B0D]"
            />
            Set as default delivery address
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddressModalOpen(false)}
              className="rounded-full border border-neutral-300 px-4 py-2 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="rounded-full bg-[#0B0B0D] px-5 py-2 font-bold text-white"
            >
              {submittingAction ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </DialogModal>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-neutral-500">
          Loading account...
        </div>
      }
    >
      <AccountPortalContent />
    </Suspense>
  );
}
