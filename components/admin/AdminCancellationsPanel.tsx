"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatDateTimeSL, formatLKR } from "@/lib/constants";
import type { CancellationRequest, ReturnRefundRequest } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { DialogModal } from "@/components/ui/DialogModal";

export function AdminCancellationsPanel() {
  const { notify } = useStore();
  const [cancellations, setCancellations] = useState<
    (CancellationRequest & { order?: number; order_number?: string })[]
  >([]);
  const [returns, setReturns] = useState<ReturnRefundRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCancel, setSelectedCancel] = useState<CancellationRequest | null>(
    null
  );
  const [cancelNote, setCancelNote] = useState("");
  const [selectedReturn, setSelectedReturn] =
    useState<ReturnRefundRequest | null>(null);
  const [returnStatus, setReturnStatus] = useState("APPROVED");
  const [returnNote, setReturnNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        adminApi.getCancellations(),
        adminApi.getReturnsRefunds(),
      ]);
      setCancellations(cRes.results ?? []);
      setReturns(rRes.results ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getCancellations().catch(() => ({ results: [] })),
      adminApi.getReturnsRefunds().catch(() => ({ results: [] })),
    ]).then(([cRes, rRes]) => {
      if (!active) return;
      setCancellations(cRes.results ?? []);
      setReturns(rRes.results ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleCancellationDecision = async (decision: "approve" | "reject") => {
    if (!selectedCancel) return;
    setSubmitting(true);
    try {
      if (decision === "approve") {
        await adminApi.approveCancellation(selectedCancel.id, cancelNote);
      } else {
        await adminApi.rejectCancellation(selectedCancel.id, cancelNote);
      }
      notify({
        type: "success",
        title: `Cancellation ${decision === "approve" ? "approved" : "rejected"}`,
      });
      setSelectedCancel(null);
      setCancelNote("");
      await loadAll();
    } catch (err) {
      notify({
        type: "error",
        title: "Action failed",
        message: err instanceof ApiError ? err.message : "Could not process.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    setSubmitting(true);
    try {
      await adminApi.resolveReturnRefund(selectedReturn.id, {
        status: returnStatus,
        admin_note: returnNote.trim() || undefined,
        type: selectedReturn.type,
        refund_amount: selectedReturn.refund_amount,
        reason: selectedReturn.reason,
      });
      notify({ type: "success", title: "Return / Refund request updated" });
      setSelectedReturn(null);
      setReturnNote("");
      await loadAll();
    } catch (err) {
      notify({
        type: "error",
        title: "Failed to resolve",
        message: err instanceof ApiError ? err.message : "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-neutral-500">
        Loading cancellations and return requests...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cancellations Section */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-[#0B0B0D]">
          Order Cancellation Requests ({cancellations.length})
        </h2>
        {cancellations.length === 0 ? (
          <div className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-8 text-center text-xs text-neutral-500">
            No cancellation requests at the moment.
          </div>
        ) : (
          <div className="space-y-3">
            {cancellations.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0B0B0D]">
                      Cancel #{c.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-neutral-400">
                      {formatDateTimeSL(c.created_at)}
                    </span>
                  </div>
                  <p className="text-neutral-700">{c.reason}</p>
                  {c.admin_note && (
                    <p className="text-neutral-500">
                      Admin note: {c.admin_note}
                    </p>
                  )}
                </div>
                {c.status === "REQUESTED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCancel(c);
                      setCancelNote("");
                    }}
                    className="shrink-0 rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-bold text-white"
                  >
                    Review Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Returns & Refunds Section */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-[#0B0B0D] flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Return & Refund Requests ({returns.length})
        </h2>
        {returns.length === 0 ? (
          <div className="rounded-2xl bg-[#F4F5F7] border border-neutral-200 p-8 text-center text-xs text-neutral-500">
            No return or refund requests submitted.
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#0B0B0D]">
                      Return #{r.id} (Order #{r.order})
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold">
                      {r.type}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        r.status === "COMPLETED" || r.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="font-bold text-[#0B0B0D] tabular-nums">
                      {formatLKR(r.refund_amount, true)}
                    </span>
                  </div>
                  <p className="text-neutral-700">{r.reason}</p>
                  {r.bank_details_for_refund && (
                    <p className="text-neutral-500">
                      Refund Bank: {r.bank_details_for_refund}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReturn(r);
                    setReturnStatus(r.status === "REQUESTED" ? "APPROVED" : r.status);
                    setReturnNote(r.admin_note ?? "");
                  }}
                  className="shrink-0 rounded-full bg-[#0B0B0D] px-4 py-2 text-xs font-bold text-white"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review Cancellation Modal */}
      <DialogModal
        open={Boolean(selectedCancel)}
        onClose={() => setSelectedCancel(null)}
        title={`Review Cancellation #${selectedCancel?.id ?? ""}`}
      >
        {selectedCancel && (
          <div className="p-5 space-y-4 text-xs">
            <p className="rounded-xl bg-[#F4F5F7] p-3 text-neutral-700">
              <strong>Customer Reason:</strong> {selectedCancel.reason}
            </p>
            <div>
              <label className="block font-bold mb-1">Admin Note</label>
              <textarea
                rows={2}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Note for customer and audit log..."
                className="w-full rounded-xl border border-neutral-300 p-2.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCancellationDecision("reject")}
                className="inline-flex items-center gap-1 rounded-full border border-red-300 px-4 py-2 font-bold text-red-600"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCancellationDecision("approve")}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-5 py-2 font-bold text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve & Restock
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Resolve Return Modal */}
      <DialogModal
        open={Boolean(selectedReturn)}
        onClose={() => setSelectedReturn(null)}
        title={`Resolve Return #${selectedReturn?.id ?? ""}`}
      >
        {selectedReturn && (
          <form onSubmit={handleResolveReturn} className="p-5 space-y-4 text-xs">
            <div className="rounded-xl bg-[#F4F5F7] p-3 space-y-1">
              <p>
                <strong>Refund Amount:</strong>{" "}
                {formatLKR(selectedReturn.refund_amount, true)}
              </p>
              <p>
                <strong>Reason:</strong> {selectedReturn.reason}
              </p>
              <p>
                <strong>Bank Details:</strong>{" "}
                {selectedReturn.bank_details_for_refund || "—"}
              </p>
            </div>

            <div>
              <label className="block font-bold mb-1">Resolution Status</label>
              <select
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                <option value="APPROVED">APPROVED</option>
                <option value="COMPLETED">COMPLETED (Refund Sent)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Admin Notes</label>
              <textarea
                rows={2}
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Refund transfer reference or inspection outcome..."
                className="w-full rounded-xl border border-neutral-300 p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="rounded-full border border-neutral-300 px-4 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#0B0B0D] px-5 py-2 font-bold text-white"
              >
                {submitting ? "Updating..." : "Save Resolution"}
              </button>
            </div>
          </form>
        )}
      </DialogModal>
    </div>
  );
}
