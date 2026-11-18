"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Copy,
  FileUp,
  Info,
  Loader2,
} from "lucide-react";
import { ApiError, paymentsApi } from "@/lib/api";
import { formatLKR } from "@/lib/constants";
import type { BankDetailsResponse, BankSlipSubmitResponse } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";

interface BankSlipUploadCardProps {
  orderNumber: string;
  amount: string | number;
  guestContact?: string;
  bankDetails?: BankDetailsResponse | null;
  existingSlipUrl?: string | null;
  existingReference?: string | null;
  paymentStatus?: string;
  adminNotes?: string | null;
  onSuccess?: (res: BankSlipSubmitResponse) => void;
}

export function BankSlipUploadCard({
  orderNumber,
  amount,
  guestContact,
  bankDetails: propBankDetails,
  existingSlipUrl,
  existingReference,
  paymentStatus,
  adminNotes,
  onSuccess,
}: BankSlipUploadCardProps) {
  const { notify } = useStore();
  const [bankDetails, setBankDetails] = useState<BankDetailsResponse | null>(
    propBankDetails ?? null
  );
  const [bankName, setBankName] = useState(
    propBankDetails?.bank_accounts?.[0]?.bank_name ?? ""
  );
  const [bankRef, setBankRef] = useState(existingReference ?? "");
  const [depositDate, setDepositDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [contact, setContact] = useState(guestContact ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRes, setSubmittedRes] =
    useState<BankSlipSubmitResponse | null>(null);

  useEffect(() => {
    if (!propBankDetails) {
      paymentsApi
        .getBankDetails()
        .then((d) => {
          setBankDetails(d);
          if (d.bank_accounts?.[0]?.bank_name) {
            setBankName((prev) => prev || d.bank_accounts[0].bank_name);
          }
        })
        .catch(() => {});
    }
  }, [propBankDetails]);

  const effectiveBankName =
    bankName || bankDetails?.bank_accounts?.[0]?.bank_name || "";

  const copyAccount = async (acct: string) => {
    try {
      await navigator.clipboard.writeText(acct);
      notify({ type: "success", title: "Account number copied", message: acct });
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      notify({
        type: "error",
        title: "Attach deposit slip",
        message: "Please select a JPG, PNG, or PDF receipt (max 5 MB).",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify({
        type: "error",
        title: "File exceeds 5 MB limit",
        message: "Please upload a smaller JPG, PNG, or PDF file.",
      });
      return;
    }

    const fd = new FormData();
    fd.append("order_number", orderNumber);
    fd.append("customer_bank_reference", bankRef.trim());
    fd.append("deposit_date", depositDate);
    if (effectiveBankName.trim()) fd.append("bank_name", effectiveBankName.trim());
    if (contact.trim()) fd.append("contact", contact.trim());
    fd.append("bank_slip_image", file);

    setSubmitting(true);
    try {
      const res = await paymentsApi.submitBankSlip(fd);
      setSubmittedRes(res);
      notify({
        type: "success",
        title: "Bank slip uploaded",
        message: res.message,
      });
      onSuccess?.(res);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to submit bank slip.";
      notify({ type: "error", title: "Upload Failed", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-neutral-200">
        <div>
          <h3 className="font-display text-xl text-[#0B0B0D] flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Direct Bank Transfer Instructions & Receipt Upload
          </h3>
          <p className="text-xs text-neutral-600 mt-1">
            Transfer exact total{" "}
            <strong className="text-[#0B0B0D] tabular-nums">
              {formatLKR(amount, true)}
            </strong>{" "}
            with Order Reference{" "}
            <strong className="font-mono text-[#0B0B0D]">{orderNumber}</strong>.
            Your order stays <strong>PENDING</strong> until our team verifies your
            deposit slip.
          </p>
        </div>
        {paymentStatus && (
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              paymentStatus === "SUCCESSFUL"
                ? "bg-emerald-100 text-emerald-800"
                : paymentStatus === "FAILED"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            Payment: {paymentStatus}
          </span>
        )}
      </div>

      {adminNotes && paymentStatus === "FAILED" && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Action Required — Previous Slip Rejected:</p>
            <p className="mt-0.5">{adminNotes}</p>
          </div>
        </div>
      )}

      {/* Bank Accounts Grid */}
      {bankDetails?.bank_accounts && bankDetails.bank_accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {bankDetails.bank_accounts.map((acct) => (
            <div
              key={`${acct.bank_name}-${acct.account_number}`}
              className="rounded-xl bg-[#F4F5F7] border border-neutral-200 p-4 text-xs space-y-1.5"
            >
              <p className="font-bold text-sm text-[#0B0B0D]">
                {acct.bank_name}
              </p>
              <p className="text-neutral-600">
                Account Name: <strong className="text-[#0B0B0D]">{acct.account_name}</strong>
              </p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-mono text-sm font-bold text-[#0B0B0D]">
                  {acct.account_number}
                </span>
                <button
                  type="button"
                  onClick={() => copyAccount(acct.account_number)}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-[#0B0B0D] hover:bg-neutral-100"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <p className="text-neutral-500">
                Branch: {acct.branch} · SWIFT: {acct.swift_code}
              </p>
            </div>
          ))}
        </div>
      )}

      {bankDetails?.instructions && (
        <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3.5 text-xs text-neutral-700 whitespace-pre-line">
          {bankDetails.instructions}
        </div>
      )}

      {submittedRes || (existingSlipUrl && paymentStatus === "PENDING") ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Deposit Slip Submitted — Pending Verification
          </div>
          <p>
            Reference:{" "}
            <strong className="font-mono">
              {submittedRes?.customer_bank_reference ?? existingReference}
            </strong>
          </p>
          {(submittedRes?.bank_slip_image || existingSlipUrl) && (
            <a
              href={(submittedRes?.bank_slip_image || existingSlipUrl) ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-block font-bold underline"
            >
              View Uploaded Receipt ↗
            </a>
          )}
        </div>
      ) : null}

      {paymentStatus !== "SUCCESSFUL" && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-neutral-200">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {existingSlipUrl ? "Resubmit Bank Transfer Receipt" : "Upload Bank Transfer Receipt"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor={`bank-ref-${orderNumber}`}
                className="block text-xs font-semibold text-[#0B0B0D] mb-1"
              >
                Bank Reference / Transaction ID *
              </label>
              <input
                id={`bank-ref-${orderNumber}`}
                required
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="e.g. TXN-8871239"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`deposit-date-${orderNumber}`}
                className="block text-xs font-semibold text-[#0B0B0D] mb-1"
              >
                Deposit / Transfer Date *
              </label>
              <input
                id={`deposit-date-${orderNumber}`}
                type="date"
                required
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`bank-name-${orderNumber}`}
                className="block text-xs font-semibold text-[#0B0B0D] mb-1"
              >
                Bank Name
              </label>
              <input
                id={`bank-name-${orderNumber}`}
                value={effectiveBankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Commercial Bank"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>

            {guestContact !== undefined && (
              <div>
                <label
                  htmlFor={`guest-contact-${orderNumber}`}
                  className="block text-xs font-semibold text-[#0B0B0D] mb-1"
                >
                  Checkout Email or Phone
                </label>
                <input
                  id={`guest-contact-${orderNumber}`}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or phone used at checkout"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor={`slip-file-${orderNumber}`}
              className="block text-xs font-semibold text-[#0B0B0D] mb-1.5"
            >
              Deposit Receipt File (.jpg, .png, or .pdf — Max 5 MB) *
            </label>
            <input
              id={`slip-file-${orderNumber}`}
              type="file"
              required
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#0B0B0D] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-800 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#0B0B0D] px-6 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileUp className="h-3.5 w-3.5" />
            )}
            {submitting ? "Uploading Slip..." : "Submit Bank Transfer Receipt"}
          </button>
        </form>
      )}
    </div>
  );
}
