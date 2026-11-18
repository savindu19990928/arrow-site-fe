import React from "react";
import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/constants";

interface PolicyLayoutProps {
  title: string;
  activeSlug: "returns" | "privacy" | "terms" | "shipping";
  children: React.ReactNode;
}

export function PolicyLayout({
  title,
  activeSlug,
  children,
}: PolicyLayoutProps) {
  const tabs = [
    { slug: "returns", label: "Return, Refund & Exchange Policy", href: "/policies/returns" },
    { slug: "shipping", label: "Shipping & Delivery Policy", href: "/policies/shipping" },
    { slug: "privacy", label: "Privacy Policy", href: "/policies/privacy" },
    { slug: "terms", label: "Terms & Conditions", href: "/policies/terms" },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-14">
      <div className="pb-6 border-b border-neutral-200">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
          {BUSINESS_INFO.legalName} · LAST UPDATED {BUSINESS_INFO.policyUpdated}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B0B0D] mt-1.5">
          {title}
        </h1>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.slug}
              href={t.href}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeSlug === t.slug
                  ? "bg-[#0B0B0D] text-white"
                  : "bg-[#F4F5F7] text-[#0B0B0D] hover:bg-neutral-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <article className="prose mt-8 space-y-6 text-base text-neutral-700 leading-[1.65] max-w-[65ch] [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-[#0B0B0D] [&_h2]:pt-3 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:text-[#0B0B0D] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </article>
    </div>
  );
}
