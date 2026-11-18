"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Landmark,
  Package,
  RotateCcw,
  ShieldAlert,
  Store,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminPaymentsPanel } from "@/components/admin/AdminPaymentsPanel";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import { AdminInventoryPanel } from "@/components/admin/AdminInventoryPanel";
import { AdminCancellationsPanel } from "@/components/admin/AdminCancellationsPanel";
import { AdminCatalogPanel } from "@/components/admin/AdminCatalogPanel";

type AdminTab =
  | "analytics"
  | "payments"
  | "orders"
  | "inventory"
  | "cancellations"
  | "catalog";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isAdmin, isLoadingAuth } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");

  if (isLoadingAuth) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-neutral-500">
        Verifying staff credentials...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-neutral-200 bg-[#F4F5F7] p-8 space-y-4">
          <ShieldAlert className="h-10 w-10 text-[#0B0B0D] mx-auto" />
          <h1 className="font-display-italic text-3xl text-[#0B0B0D]">
            Staff & Admin Access Required
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            {isAuthenticated
              ? `Your account (${user?.email}) has role ${user?.role}. Sign in with an ADMIN or STAFF account to manage orders, bank transfers, and inventory.`
              : "Please sign in with your Arrow Ventures ADMIN or STAFF credentials."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login?redirect=/admin"
              className="rounded-full bg-[#0B0B0D] px-6 py-2.5 text-xs font-bold text-white"
            >
              Sign In as Staff / Admin
            </Link>
            <Link
              href="/"
              className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-xs font-semibold text-[#0B0B0D]"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
            ARROW VENTURES OPERATIONS
          </p>
          <h1 className="font-display-italic text-3xl sm:text-4xl text-[#0B0B0D] mt-1">
            Admin Command Center
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Signed in as <strong>{user?.email}</strong> ({user?.role})
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-neutral-300 px-4 py-2 text-xs font-bold text-[#0B0B0D] hover:bg-[#F4F5F7]"
        >
          <Store className="h-3.5 w-3.5" />
          View Storefront
        </Link>
      </div>

      {/* Horizontal Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "analytics", label: "KPIs & Analytics", icon: BarChart3 },
            { id: "payments", label: "Bank Queue & Payments", icon: Landmark },
            { id: "orders", label: "Orders & Tracking", icon: Package },
            { id: "inventory", label: "Inventory & Ledger", icon: Boxes },
            {
              id: "cancellations",
              label: "Cancellations & Returns",
              icon: RotateCcw,
            },
            { id: "catalog", label: "Catalog & Reviews", icon: Store },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-colors ${
                active
                  ? "bg-[#0B0B0D] text-white"
                  : "bg-[#F4F5F7] text-[#0B0B0D] hover:bg-neutral-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Admin Workspace */}
      <div>
        {activeTab === "analytics" && (
          <AdminAnalyticsPanel
            onNavigateTab={(t) => setActiveTab(t as AdminTab)}
          />
        )}
        {activeTab === "payments" && <AdminPaymentsPanel />}
        {activeTab === "orders" && <AdminOrdersPanel />}
        {activeTab === "inventory" && <AdminInventoryPanel />}
        {activeTab === "cancellations" && <AdminCancellationsPanel />}
        {activeTab === "catalog" && <AdminCatalogPanel />}
      </div>
    </div>
  );
}
