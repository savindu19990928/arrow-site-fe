"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Download,
  Landmark,
  Package,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatDateTimeSL, formatLKR } from "@/lib/constants";
import type { AdminDashboardSummary, AdminNotification } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";

type ReportTab =
  | "income"
  | "orders"
  | "payments"
  | "product-sales"
  | "inventory"
  | "customer-purchases"
  | "discounts-promotions"
  | "cancellations-refunds";

export function AdminAnalyticsPanel({
  onNavigateTab,
}: {
  onNavigateTab: (tab: string) => void;
}) {
  const { notify } = useStore();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [activeReport, setActiveReport] = useState<ReportTab>("income");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(
    null
  );
  const [loadingReport, setLoadingReport] = useState(false);

  const loadReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const data = await adminApi.getReport(activeReport, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReportData(data);
    } catch {
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  }, [activeReport, startDate, endDate]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getDashboardSummary(),
      adminApi.getNotifications(),
    ])
      .then(([sum, notifs]) => {
        if (!active) return;
        setSummary(sum);
        setNotifications(notifs);
      })
      .catch((err) => {
        if (!active) return;
        notify({
          type: "error",
          title: "Failed to load admin summary",
          message: err instanceof ApiError ? err.message : "Try refreshing.",
        });
      });
    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    let active = true;
    adminApi
      .getReport(activeReport, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      .then((data) => {
        if (active) setReportData(data);
      })
      .catch(() => {
        if (active) setReportData(null);
      })
      .finally(() => {
        if (active) setLoadingReport(false);
      });
    return () => {
      active = false;
    };
  }, [activeReport, startDate, endDate]);

  const handleExportCsv = async () => {
    try {
      const { blob, filename } = await adminApi.exportReportCsv(activeReport, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `arrow_${activeReport}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      notify({ type: "success", title: "CSV report exported" });
    } catch (err) {
      notify({
        type: "error",
        title: "Export failed",
        message: err instanceof ApiError ? err.message : "Unable to export CSV.",
      });
    }
  };

  const reportSummary = (reportData?.summary ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-[#0B0B0D] text-white p-5 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Today&apos;s Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-display text-2xl sm:text-3xl tabular-nums">
            {summary ? formatLKR(summary.today_revenue) : "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-5 space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Month-to-Date</span>
            <TrendingUp className="h-4 w-4 text-[#0B0B0D]" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-[#0B0B0D] tabular-nums">
            {summary ? formatLKR(summary.month_to_date_revenue) : "—"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("orders")}
          className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-5 space-y-1 text-left hover:border-[#0B0B0D] transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Active Orders</span>
            <Package className="h-4 w-4 text-[#0B0B0D]" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-[#0B0B0D] tabular-nums">
            {summary?.active_orders_count ?? "—"}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("payments")}
          className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-1 text-left hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Pending Bank Slips</span>
            <Landmark className="h-4 w-4 text-amber-700" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-amber-950 tabular-nums">
            {summary?.pending_bank_verifications_count ?? "—"}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("inventory")}
          className="rounded-2xl bg-red-50 border border-red-200 p-5 space-y-1 text-left hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between text-red-800 text-xs font-semibold">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-red-950 tabular-nums">
            {summary?.low_stock_alerts_count ?? "—"}
          </p>
        </button>
      </div>

      {/* Business Analytics Reports + CSV Export */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h2 className="font-display text-2xl text-[#0B0B0D]">
              Business Intelligence & Reports
            </h2>
            <p className="text-xs text-neutral-500">
              Filter by date range or export CSV directly from live API endpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Report start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs"
            />
            <span className="text-xs text-neutral-400">to</span>
            <input
              type="date"
              aria-label="Report end date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-[#F4F5F7]"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0B0D] px-4 py-1.5 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "income", label: "Income & Net Revenue" },
              { id: "orders", label: "Orders & AOV" },
              { id: "payments", label: "Payments Breakdown" },
              { id: "product-sales", label: "Product Sales" },
              { id: "inventory", label: "Inventory Valuation" },
              { id: "customer-purchases", label: "Top Customers" },
              { id: "discounts-promotions", label: "Coupons & Discounts" },
              { id: "cancellations-refunds", label: "Cancellations & Refunds" },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveReport(r.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeReport === r.id
                  ? "bg-[#0B0B0D] text-white"
                  : "bg-[#F4F5F7] text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loadingReport ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Loading report metrics...
          </div>
        ) : reportData ? (
          <div className="space-y-5">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(reportSummary).map(([k, v]) => {
                const label = k.replace(/_/g, " ");
                const isMoney =
                  k.includes("revenue") ||
                  k.includes("amount") ||
                  k.includes("subtotal") ||
                  k.includes("valuation") ||
                  k.includes("volume") ||
                  k.includes("charges") ||
                  k.includes("discounts") ||
                  k.includes("value");
                return (
                  <div
                    key={k}
                    className="rounded-xl bg-[#F4F5F7] border border-neutral-200 p-3.5"
                  >
                    <p className="text-[11px] font-semibold uppercase text-neutral-500 capitalize">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[#0B0B0D] tabular-nums truncate">
                      {typeof v === "number" && isMoney
                        ? formatLKR(v)
                        : String(v ?? "—")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Array Sub-tables / Visual Bars */}
            {Object.entries(reportData).map(([key, val]) => {
              if (!Array.isArray(val) || val.length === 0) return null;
              const rows = val as Record<string, unknown>[];
              const headers = Object.keys(rows[0]);
              return (
                <div key={key} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {key.replace(/_/g, " ")}
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-neutral-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F5F7] border-b border-neutral-200">
                        <tr>
                          {headers.map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2.5 font-bold text-[#0B0B0D] capitalize"
                            >
                              {h.replace(/__/g, " ").replace(/_/g, " ")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            {headers.map((h) => (
                              <td
                                key={h}
                                className="px-4 py-2.5 text-neutral-700 tabular-nums"
                              >
                                {String(row[h] ?? "—")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            No report records found for the selected filter.
          </p>
        )}
      </div>

      {/* Admin Operational Alerts */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-3">
        <h2 className="font-display text-xl text-[#0B0B0D] flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Operational Alerts Feed
        </h2>
        {notifications.length === 0 ? (
          <p className="text-xs text-neutral-500">All clear — no alerts.</p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="inline-block rounded-full bg-[#F4F5F7] px-2 py-0.5 text-[10px] font-bold text-[#0B0B0D] mr-2">
                    {n.notification_type}
                  </span>
                  <strong className="text-[#0B0B0D]">{n.title}</strong>
                  <p className="text-neutral-600 mt-0.5">{n.message}</p>
                </div>
                <span className="text-[11px] text-neutral-400 shrink-0">
                  {formatDateTimeSL(n.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
