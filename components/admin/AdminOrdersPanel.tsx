"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Search, Truck } from "lucide-react";
import { adminApi, ApiError, ordersApi } from "@/lib/api";
import { formatDateSL, formatLKR } from "@/lib/constants";
import type { OrderDetail, OrderStatus } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { DialogModal } from "@/components/ui/DialogModal";

const ALL_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "HANDED_OVER",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export function AdminOrdersPanel() {
  const { notify } = useStore();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>("CONFIRMED");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setOrders(res.results ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let active = true;
    adminApi
      .getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
      })
      .then((res) => {
        if (active) setOrders(res.results ?? []);
      })
      .catch(() => {
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, [search, statusFilter]);

  const openManageOrder = async (ord: OrderDetail) => {
    try {
      const full = await adminApi.getOrderDetail(ord.id);
      setSelectedOrder(full);
      setNextStatus(full.status);
      setCourierName(full.courier_name ?? "");
      setTrackingNumber(full.tracking_number ?? "");
      setStatusNote("");
    } catch {
      setSelectedOrder(ord);
      setNextStatus(ord.status);
      setCourierName(ord.courier_name ?? "");
      setTrackingNumber(ord.tracking_number ?? "");
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(selectedOrder.id, {
        status: nextStatus,
        courier_name: courierName.trim() || undefined,
        tracking_number: trackingNumber.trim() || undefined,
        note: statusNote.trim() || undefined,
      });
      notify({
        type: "success",
        title: `${selectedOrder.order_number} updated to ${nextStatus}`,
      });
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      notify({
        type: "error",
        title: "Status update failed",
        message: err instanceof ApiError ? err.message : "Try again.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async (order: OrderDetail) => {
    try {
      const { blob, filename } = await ordersApi.downloadInvoice(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Invoice_${order.order_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify({
        type: "error",
        title: "Download failed",
        message: err instanceof ApiError ? err.message : "Unable to load PDF.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-3.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, tracking..."
            className="w-full rounded-full border border-neutral-300 bg-white pl-9 pr-3 py-1.5 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold"
        >
          <option value="">All Order Statuses</option>
          {ALL_ORDER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={loadOrders}
          className="rounded-full bg-[#0B0B0D] px-4 py-1.5 text-xs font-bold text-white"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          Loading store orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-10 text-center text-xs text-neutral-500">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 font-bold">Order #</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Courier / Tracking</th>
                <th className="px-4 py-3 font-bold text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[#0B0B0D] block">
                      {ord.order_number}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatDateSL(ord.placed_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold block">{ord.customer_name}</span>
                    <span className="text-[11px] text-neutral-500">
                      {ord.shipping_city}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums">
                    {formatLKR(ord.total_amount, true)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-semibold">{ord.payment_method}</span>
                    <span className="text-[10px] text-neutral-500">
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#0B0B0D] text-white px-2.5 py-0.5 text-[10px] font-bold">
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px]">
                    {ord.courier_name ? (
                      <>
                        <span className="block font-semibold">{ord.courier_name}</span>
                        <span className="font-mono text-neutral-500">
                          {ord.tracking_number}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(ord)}
                      aria-label={`Download invoice for ${ord.order_number}`}
                      className="inline-flex items-center rounded-full border border-neutral-300 p-1.5 hover:bg-[#F4F5F7]"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openManageOrder(ord)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] px-3.5 py-1.5 text-[11px] font-bold text-white"
                    >
                      <Truck className="h-3 w-3" />
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DialogModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Manage Order ${selectedOrder?.order_number ?? ""}`}
        maxWidthClass="max-w-xl"
      >
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} className="p-5 space-y-4 text-xs">
            <div className="rounded-xl bg-[#F4F5F7] p-3.5 space-y-1 border border-neutral-200">
              <p>
                <strong>Recipient:</strong> {selectedOrder.shipping_recipient_name} (
                {selectedOrder.shipping_phone})
              </p>
              <p className="text-neutral-600">
                {selectedOrder.shipping_address_line1}, {selectedOrder.shipping_city}{" "}
                {selectedOrder.shipping_postal_code}
              </p>
              <p>
                <strong>Items:</strong> {(selectedOrder.items ?? []).length} line(s) ·{" "}
                <strong>{formatLKR(selectedOrder.total_amount, true)}</strong>
              </p>
            </div>

            <div>
              <label className="block font-bold mb-1">Order Status *</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                {ALL_ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Courier Service</label>
                <input
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Domex Courier Services"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Tracking Number</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DX-7721908"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Status Note</label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Package dispatched from Colombo central depot..."
                className="w-full rounded-xl border border-neutral-300 p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full border border-neutral-300 px-4 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="rounded-full bg-[#0B0B0D] px-5 py-2 font-bold text-white"
              >
                {updating ? "Updating..." : "Save Status"}
              </button>
            </div>
          </form>
        )}
      </DialogModal>
    </div>
  );
}
