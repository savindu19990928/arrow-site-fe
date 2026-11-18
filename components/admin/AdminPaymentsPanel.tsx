"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatDateSL, formatDateTimeSL, formatLKR } from "@/lib/constants";
import type {
  AdminPaymentRecord,
  BankAccountInfo,
  BankDetailsResponse,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { DialogModal } from "@/components/ui/DialogModal";

export function AdminPaymentsPanel() {
  const { user, notify } = useStore();
  const [subView, setSubView] = useState<"queue" | "all" | "bank-config">(
    "queue"
  );
  const [queue, setQueue] = useState<AdminPaymentRecord[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters for all payments
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "">("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [search, setSearch] = useState("");

  // Verification modal
  const [selectedPayment, setSelectedPayment] =
    useState<AdminPaymentRecord | null>(null);
  const [verifyTxnId, setVerifyTxnId] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Store Bank Accounts Config
  const [bankConfig, setBankConfig] = useState<BankDetailsResponse>({
    bank_accounts: [],
    instructions: "",
  });
  const [savingBankConfig, setSavingBankConfig] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingVerifications();
      setQueue(res.results ?? []);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayments({
        payment_method: methodFilter,
        status: statusFilter,
        search: search || undefined,
      });
      setPayments(res.results ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [methodFilter, statusFilter, search]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getPendingVerifications().catch(() => ({ results: [] as AdminPaymentRecord[] })),
      adminApi.getPayments({ payment_method: methodFilter, status: statusFilter, search: search || undefined }).catch(() => ({ results: [] as AdminPaymentRecord[] })),
      adminApi.getBankDetails().catch(() => null),
    ]).then(([qRes, pRes, cfg]) => {
      if (!active) return;
      setQueue(qRes.results ?? []);
      setPayments(pRes.results ?? []);
      if (cfg) setBankConfig(cfg);
    });
    return () => {
      active = false;
    };
  }, [methodFilter, statusFilter, search]);

  const openVerifyModal = (p: AdminPaymentRecord) => {
    setSelectedPayment(p);
    setVerifyTxnId(p.transaction_id ?? "");
    setVerifyNotes(p.admin_notes ?? "");
  };

  const handleVerifyAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      await adminApi.verifyBankPayment(selectedPayment.id, {
        action,
        transaction_id: verifyTxnId.trim() || undefined,
        admin_notes: verifyNotes.trim() || undefined,
        confirm_without_slip:
          action === "APPROVE" && !selectedPayment.is_bank_transfer_submitted,
      });
      notify({
        type: action === "APPROVE" ? "success" : "info",
        title:
          action === "APPROVE"
            ? `Payment approved for ${selectedPayment.order_number}`
            : `Payment rejected for ${selectedPayment.order_number}`,
      });
      setSelectedPayment(null);
      await Promise.all([loadQueue(), loadAllPayments()]);
    } catch (err) {
      notify({
        type: "error",
        title: "Verification action failed",
        message: err instanceof ApiError ? err.message : "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBankConfig(true);
    try {
      const updated = await adminApi.updateBankDetails(bankConfig);
      setBankConfig(updated);
      notify({ type: "success", title: "Store bank details updated" });
    } catch (err) {
      notify({
        type: "error",
        title: "Update failed",
        message:
          err instanceof ApiError ? err.message : "Only ADMIN role can update.",
      });
    } finally {
      setSavingBankConfig(false);
    }
  };

  const updateAccountField = (
    idx: number,
    field: keyof BankAccountInfo,
    val: string
  ) => {
    setBankConfig((prev) => {
      const next = [...prev.bank_accounts];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, bank_accounts: next };
    });
  };

  const listToDisplay = subView === "queue" ? queue : payments;

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubView("queue")}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              subView === "queue"
                ? "bg-[#0B0B0D] text-white"
                : "bg-[#F4F5F7] text-[#0B0B0D]"
            }`}
          >
            Bank Verification Queue ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView("all")}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              subView === "all"
                ? "bg-[#0B0B0D] text-white"
                : "bg-[#F4F5F7] text-[#0B0B0D]"
            }`}
          >
            All Payment Records
          </button>
          <button
            type="button"
            onClick={() => setSubView("bank-config")}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              subView === "bank-config"
                ? "bg-[#0B0B0D] text-white"
                : "bg-[#F4F5F7] text-[#0B0B0D]"
            }`}
          >
            Company Bank Details
          </button>
        </div>
      </div>

      {subView === "all" && (
        <div className="flex flex-wrap items-center gap-2.5 bg-[#F4F5F7] p-3.5 rounded-2xl border border-neutral-200">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, bank ref, txn ID..."
              className="w-full rounded-full border border-neutral-300 bg-white pl-9 pr-3 py-1.5 text-xs"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) =>
              setMethodFilter(e.target.value as PaymentMethod | "")
            }
            className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold"
          >
            <option value="">All Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="KOKO">Koko BNPL</option>
            <option value="MINTPAY">Mintpay</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PaymentStatus | "")
            }
            className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <button
            type="button"
            onClick={loadAllPayments}
            className="rounded-full bg-[#0B0B0D] px-4 py-1.5 text-xs font-bold text-white"
          >
            Filter
          </button>
        </div>
      )}

      {subView === "bank-config" ? (
        <form
          onSubmit={handleSaveBankConfig}
          className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-[#0B0B0D] flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Official Store Bank Accounts
            </h2>
            <button
              type="button"
              onClick={() =>
                setBankConfig((prev) => ({
                  ...prev,
                  bank_accounts: [
                    ...prev.bank_accounts,
                    {
                      bank_name: "",
                      account_name: "Arrow Ventures (Pvt) Ltd",
                      account_number: "",
                      branch: "",
                      swift_code: "",
                    },
                  ],
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Bank Account
            </button>
          </div>

          <div className="space-y-4">
            {bankConfig.bank_accounts.map((acct, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#F4F5F7] border border-neutral-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
              >
                <input
                  required
                  placeholder="Bank Name"
                  value={acct.bank_name}
                  onChange={(e) =>
                    updateAccountField(idx, "bank_name", e.target.value)
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
                <input
                  required
                  placeholder="Account Name"
                  value={acct.account_name}
                  onChange={(e) =>
                    updateAccountField(idx, "account_name", e.target.value)
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
                <input
                  required
                  placeholder="Account Number"
                  value={acct.account_number}
                  onChange={(e) =>
                    updateAccountField(idx, "account_number", e.target.value)
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono"
                />
                <input
                  required
                  placeholder="Branch"
                  value={acct.branch}
                  onChange={(e) =>
                    updateAccountField(idx, "branch", e.target.value)
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
                <input
                  required
                  placeholder="SWIFT Code"
                  value={acct.swift_code}
                  onChange={(e) =>
                    updateAccountField(idx, "swift_code", e.target.value)
                  }
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setBankConfig((prev) => ({
                      ...prev,
                      bank_accounts: prev.bank_accounts.filter(
                        (_, i) => i !== idx
                      ),
                    }))
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-white text-red-600 px-3 py-2 font-semibold hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Customer Payment Instructions
            </label>
            <textarea
              rows={4}
              value={bankConfig.instructions}
              onChange={(e) =>
                setBankConfig({ ...bankConfig, instructions: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-300 p-3 text-xs"
            />
          </div>

          {user?.role === "ADMIN" || user?.is_superuser ? (
            <button
              type="submit"
              disabled={savingBankConfig}
              className="rounded-full bg-[#0B0B0D] px-6 py-2.5 text-xs font-bold text-white"
            >
              {savingBankConfig ? "Saving..." : "Save Bank Settings"}
            </button>
          ) : (
            <p className="text-xs text-amber-700">
              Only ADMIN role users can modify store bank accounts.
            </p>
          )}
        </form>
      ) : loading ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          Loading payments...
        </div>
      ) : listToDisplay.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-[#F4F5F7] p-10 text-center text-xs text-neutral-500">
          {subView === "queue"
            ? "No pending bank transfer receipts awaiting verification."
            : "No payments matched your filter."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 font-bold">Order #</th>
                <th className="px-4 py-3 font-bold">Method</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Bank Reference</th>
                <th className="px-4 py-3 font-bold">Submitted</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {listToDisplay.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0B0B0D]">
                    {p.order_number}
                  </td>
                  <td className="px-4 py-3">{p.payment_method}</td>
                  <td className="px-4 py-3 font-bold tabular-nums">
                    {formatLKR(p.amount, true)}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {p.customer_bank_reference || p.transaction_id || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {p.bank_transfer_submitted_at
                      ? formatDateTimeSL(p.bank_transfer_submitted_at)
                      : formatDateSL(p.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        p.status === "SUCCESSFUL"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openVerifyModal(p)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#0B0B0D] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-neutral-800"
                    >
                      <Eye className="h-3 w-3" />
                      Inspect / Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bank Transfer Verification Modal */}
      <DialogModal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={`Verify Payment — ${selectedPayment?.order_number ?? ""}`}
        maxWidthClass="max-w-2xl"
      >
        {selectedPayment && (
          <div className="p-5 sm:p-6 space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-[#F4F5F7] p-4 border border-neutral-200">
              <div>
                <span className="text-neutral-500 block">Amount</span>
                <strong className="text-sm text-[#0B0B0D] tabular-nums">
                  {formatLKR(selectedPayment.amount, true)}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Customer Bank Ref</span>
                <strong className="font-mono text-[#0B0B0D]">
                  {selectedPayment.customer_bank_reference || "—"}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Deposit Date</span>
                <strong className="text-[#0B0B0D]">
                  {selectedPayment.deposit_date || "—"}
                </strong>
              </div>
            </div>

            {selectedPayment.bank_slip_image ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B0B0D]">
                    Uploaded Receipt Preview
                  </span>
                  <a
                    href={selectedPayment.bank_slip_image}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#0B0B0D] underline"
                  >
                    Open Full File
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {selectedPayment.bank_slip_image.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={selectedPayment.bank_slip_image}
                    title="Bank slip PDF preview"
                    className="w-full h-72 rounded-xl border border-neutral-200"
                  />
                ) : (
                  <img
                    src={selectedPayment.bank_slip_image}
                    alt="Customer bank slip"
                    className="max-h-72 w-full object-contain rounded-xl border border-neutral-200 bg-neutral-50"
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                No receipt file attached yet.
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-neutral-200">
              <div>
                <label className="block font-bold mb-1">
                  Bank Statement Transaction ID (for Approval)
                </label>
                <input
                  value={verifyTxnId}
                  onChange={(e) => setVerifyTxnId(e.target.value)}
                  placeholder="e.g. BANK-STMT-9901"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  Admin Verification / Rejection Notes
                </label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Matched with bank statement OR explain why receipt was rejected..."
                  className="w-full rounded-xl border border-neutral-300 p-2.5"
                />
              </div>
            </div>

            {selectedPayment.payment_method === "BANK_TRANSFER" && (
              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleVerifyAction("REJECT")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-5 py-2 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject Slip
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleVerifyAction("APPROVE")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve & Confirm Order
                </button>
              </div>
            )}
          </div>
        )}
      </DialogModal>
    </div>
  );
}
