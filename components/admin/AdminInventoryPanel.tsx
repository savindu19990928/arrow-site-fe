"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowDownUp, Boxes, ClipboardList } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatDateTimeSL } from "@/lib/constants";
import type {
  StockLevelProduct,
  StockMovement,
  StockMovementType,
} from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { DialogModal } from "@/components/ui/DialogModal";

export function AdminInventoryPanel() {
  const { notify } = useStore();
  const [view, setView] = useState<"levels" | "ledger">("levels");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [levels, setLevels] = useState<StockLevelProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  const [adjustProduct, setAdjustProduct] = useState<StockLevelProduct | null>(
    null
  );
  const [movementType, setMovementType] = useState<StockMovementType>("RESTOCK");
  const [qty, setQty] = useState("5");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getStockLevels({
        low_stock: stockFilter === "low" ? true : undefined,
        out_of_stock: stockFilter === "out" ? true : undefined,
      });
      setLevels(res.results ?? []);
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, [stockFilter]);

  const loadLedger = useCallback(async () => {
    try {
      const res = await adminApi.getStockMovements();
      setMovements(res.results ?? []);
    } catch {
      setMovements([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi
        .getStockLevels({
          low_stock: stockFilter === "low" ? true : undefined,
          out_of_stock: stockFilter === "out" ? true : undefined,
        })
        .catch(() => ({ results: [] as StockLevelProduct[] })),
      adminApi
        .getStockMovements()
        .catch(() => ({ results: [] as StockMovement[] })),
    ]).then(([lvlRes, movRes]) => {
      if (!active) return;
      setLevels(lvlRes.results ?? []);
      setMovements(movRes.results ?? []);
    });
    return () => {
      active = false;
    };
  }, [stockFilter]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    const numericQty = parseInt(qty, 10);
    if (!Number.isFinite(numericQty) || numericQty === 0) {
      notify({ type: "error", title: "Enter a non-zero integer quantity" });
      return;
    }
    setSaving(true);
    try {
      await adminApi.adjustStock({
        product_id: adjustProduct.id,
        quantity: numericQty,
        movement_type: movementType,
        reason: reason.trim() || `${movementType} adjustment`,
      });
      notify({
        type: "success",
        title: `Stock updated for ${adjustProduct.name}`,
      });
      setAdjustProduct(null);
      setReason("");
      await Promise.all([loadLevels(), loadLedger()]);
    } catch (err) {
      notify({
        type: "error",
        title: "Adjustment failed",
        message: err instanceof ApiError ? err.message : "Could not adjust stock.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("levels")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
              view === "levels"
                ? "bg-[#0B0B0D] text-white"
                : "bg-[#F4F5F7] text-[#0B0B0D]"
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            Stock Levels
          </button>
          <button
            type="button"
            onClick={() => setView("ledger")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
              view === "ledger"
                ? "bg-[#0B0B0D] text-white"
                : "bg-[#F4F5F7] text-[#0B0B0D]"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Stock Audit Ledger ({movements.length})
          </button>
        </div>

        {view === "levels" && (
          <div className="flex gap-1.5">
            {(
              [
                { id: "all", label: "All Inventory" },
                { id: "low", label: "Low Stock" },
                { id: "out", label: "Out of Stock" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStockFilter(f.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                  stockFilter === f.id
                    ? "border-[#0B0B0D] bg-[#0B0B0D] text-white"
                    : "border-neutral-300 bg-white text-neutral-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "levels" ? (
        loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Loading inventory levels...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F5F7] border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 font-bold">SKU</th>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">On Hand</th>
                  <th className="px-4 py-3 font-bold">Alert Threshold</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {levels.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-600">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0B0B0D]">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {item.category_name}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-sm tabular-nums">
                      {item.stock_quantity}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-500">
                      {item.low_stock_threshold}
                    </td>
                    <td className="px-4 py-3">
                      {item.is_out_of_stock ? (
                        <span className="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-[10px] font-bold">
                          Out of Stock
                        </span>
                      ) : item.is_low_stock ? (
                        <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold">
                          Low Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustProduct(item);
                          setMovementType("RESTOCK");
                          setQty("5");
                          setReason("");
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] px-3.5 py-1.5 text-[11px] font-bold text-white"
                      >
                        <ArrowDownUp className="h-3 w-3" />
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 font-bold">Timestamp</th>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Delta</th>
                <th className="px-4 py-3 font-bold">Before → After</th>
                <th className="px-4 py-3 font-bold">Reason</th>
                <th className="px-4 py-3 font-bold">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-500">
                    {formatDateTimeSL(m.created_at)}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0B0B0D]">
                    {m.product_name}
                    {m.variant_name && (
                      <span className="block font-normal text-neutral-500">
                        {m.variant_name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{m.movement_type}</td>
                  <td
                    className={`px-4 py-3 font-bold tabular-nums ${
                      m.quantity >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {m.before_stock} → <strong>{m.after_stock}</strong>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{m.reason || "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {m.created_by_email || "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <DialogModal
        open={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        title={`Adjust Stock — ${adjustProduct?.name ?? ""}`}
      >
        {adjustProduct && (
          <form onSubmit={handleAdjust} className="p-5 space-y-4 text-xs">
            <p className="text-neutral-600">
              Current Stock: <strong className="text-[#0B0B0D]">{adjustProduct.stock_quantity}</strong>{" "}
              units (SKU: <span className="font-mono">{adjustProduct.sku}</span>)
            </p>

            <div>
              <label className="block font-bold mb-1">Movement Type</label>
              <select
                value={movementType}
                onChange={(e) =>
                  setMovementType(e.target.value as StockMovementType)
                }
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                <option value="RESTOCK">RESTOCK (Inward Shipment)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Manual Count)</option>
                <option value="DAMAGE">DAMAGE (Damaged / Scrapped)</option>
                <option value="RETURN">RETURN (Customer Return Restock)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">
                Quantity Change (+ to add, - to deduct) *
              </label>
              <input
                type="number"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Audit Reason *</label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Container shipment batch #ARW-2026-04"
                className="w-full rounded-xl border border-neutral-300 p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustProduct(null)}
                className="rounded-full border border-neutral-300 px-4 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0B0B0D] px-5 py-2 font-bold text-white"
              >
                {saving ? "Saving..." : "Apply Stock Adjustment"}
              </button>
            </div>
          </form>
        )}
      </DialogModal>
    </div>
  );
}
