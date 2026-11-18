"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else if (
        user.role === "ADMIN" ||
        user.role === "STAFF" ||
        user.is_staff ||
        user.is_superuser
      ) {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full px-4 py-14 sm:py-20">
      <div className="rounded-3xl border border-neutral-200 bg-white p-7 sm:p-9 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          ARROW VENTURES ACCOUNT
        </p>
        <h1 className="font-display text-3xl text-[#0B0B0D] mt-1">
          Welcome Back
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          Sign in to manage your orders, saved addresses, invoices, or admin portal.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#0B0B0D] mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#0B0B0D] mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-[#0B0B0D] focus:outline-none"
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
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-200 text-center space-y-2 text-xs text-neutral-600">
          <p>
            New to Arrow Ventures?{" "}
            <Link
              href="/register"
              className="font-bold text-[#0B0B0D] hover:underline"
            >
              Create a free account
            </Link>
          </p>
          <p>
            Placed a guest order?{" "}
            <Link
              href="/track-order"
              className="font-semibold text-[#0B0B0D] hover:underline"
            >
              Track order without signing in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
