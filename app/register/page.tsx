"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        password_confirm: passwordConfirm,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
      });
      router.push("/account");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create account. Please verify your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-12 sm:py-16">
      <div className="rounded-3xl border border-neutral-200 bg-white p-7 sm:p-9 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          JOIN ARROW VENTURES
        </p>
        <h1 className="font-display-italic text-3xl text-[#0B0B0D] mt-1">
          Create Customer Account
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          Save multiple Sri Lankan delivery addresses, download PDF invoices, and
          manage warranty or wishlist items.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                First Name *
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nimal"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                Last Name *
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Perera"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nimal.perera@example.com"
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94771234567"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B0B0D] mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0B0D] py-3 px-6 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#0B0B0D] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
