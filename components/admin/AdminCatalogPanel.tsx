"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Star, Tag, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatDateSL, formatLKR } from "@/lib/constants";
import type {
  AdminCoupon,
  ProductDetail,
  ProductReview,
  PromotionalCampaign,
} from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";

export function AdminCatalogPanel() {
  const { notify } = useStore();
  const [sub, setSub] = useState<"products" | "promotions" | "reviews">(
    "products"
  );
  const [products, setProducts] = useState<
    (ProductDetail & { cost_price?: string | null; is_active?: boolean })[]
  >([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [p, c, camp, rev] = await Promise.all([
        adminApi.getAdminProducts(),
        adminApi.getAdminCoupons(),
        adminApi.getAdminCampaigns(),
        adminApi.getAdminReviews(),
      ]);
      setProducts(p.results ?? []);
      setCoupons(c.results ?? []);
      setCampaigns(camp.results ?? []);
      setReviews(rev.results ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getAdminProducts().catch(() => ({ results: [] })),
      adminApi.getAdminCoupons().catch(() => ({ results: [] })),
      adminApi.getAdminCampaigns().catch(() => ({ results: [] })),
      adminApi.getAdminReviews().catch(() => ({ results: [] })),
    ]).then(([p, c, camp, rev]) => {
      if (!active) return;
      setProducts(p.results ?? []);
      setCoupons(c.results ?? []);
      setCampaigns(camp.results ?? []);
      setReviews(rev.results ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleProductFlag = async (
    id: number,
    field: "is_featured" | "is_active",
    current: boolean
  ) => {
    try {
      await adminApi.updateAdminProduct(id, { [field]: !current });
      notify({ type: "success", title: "Product updated" });
      await loadAll();
    } catch (err) {
      notify({
        type: "error",
        title: "Update failed",
        message: err instanceof ApiError ? err.message : "Error saving.",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "products", label: `Catalog Products (${products.length})` },
            { id: "promotions", label: `Coupons & Campaigns (${coupons.length})` },
            { id: "reviews", label: `Review Moderation (${reviews.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSub(t.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              sub === t.id
                ? "bg-[#0B0B0D] text-white"
                : "bg-[#F4F5F7] text-[#0B0B0D]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "products" && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F5F7] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 font-bold">SKU</th>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Sell Price</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">3D</th>
                <th className="px-4 py-3 font-bold">Featured</th>
                <th className="px-4 py-3 font-bold">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-neutral-500">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0B0B0D]">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums">
                    {formatLKR(p.price)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.stock_quantity}</td>
                  <td className="px-4 py-3">{p.has_3d_model ? "Yes" : "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        toggleProductFlag(p.id, "is_featured", p.is_featured)
                      }
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        p.is_featured
                          ? "bg-[#0B0B0D] text-white"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {p.is_featured ? "Featured" : "Standard"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        toggleProductFlag(
                          p.id,
                          "is_active",
                          p.is_active ?? true
                        )
                      }
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        p.is_active !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.is_active !== false ? "Active" : "Hidden"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sub === "promotions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <h3 className="font-display text-lg text-[#0B0B0D] flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Active Coupons
            </h3>
            {coupons.length === 0 ? (
              <p className="text-xs text-neutral-500">No coupons configured.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-[#F4F5F7] p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#0B0B0D]">
                        {c.code}
                      </span>
                      <p className="text-neutral-500">
                        {c.discount_type === "PERCENTAGE"
                          ? `${c.discount_value}% off`
                          : formatLKR(c.discount_value)}{" "}
                        · Used {c.usage_count}
                        {c.usage_limit ? `/${c.usage_limit}` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <h3 className="font-display text-lg text-[#0B0B0D]">
              Promotional Campaigns
            </h3>
            {campaigns.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No active campaigns in backend yet.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {campaigns.map((cam) => (
                  <div key={cam.id} className="rounded-xl bg-[#F4F5F7] p-3">
                    <p className="font-bold text-[#0B0B0D]">{cam.title}</p>
                    <p className="text-neutral-600">{cam.description}</p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      {formatDateSL(cam.start_date)} –{" "}
                      {formatDateSL(cam.end_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {sub === "reviews" && (
        <div className="space-y-2.5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-start justify-between gap-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-[#0B0B0D]">{r.user_name}</strong>
                  <span className="inline-flex items-center gap-0.5 text-[#F59E0B]">
                    <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                    {r.rating}
                  </span>
                  <span className="text-neutral-400">
                    {formatDateSL(r.created_at)}
                  </span>
                </div>
                <p className="font-bold mt-1">{r.title}</p>
                <p className="text-neutral-600 mt-0.5">{r.review_text}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await adminApi.deleteAdminReview(r.id);
                  notify({ type: "info", title: "Review removed" });
                  await loadAll();
                }}
                aria-label="Delete review"
                className="p-2 text-neutral-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
