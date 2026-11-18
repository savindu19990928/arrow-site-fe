import React, { Suspense } from "react";
import type { Metadata } from "next";
import {
  getBrandsServer,
  getCategoriesServer,
  getProductsServer,
} from "@/lib/server-api";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";

export const metadata: Metadata = {
  title: "Shop Electric Cycles, Parts & Gear",
  description:
    "Browse Arrow Ventures electric mountain bikes, commuter e-bikes, genuine spare parts, lithium batteries, and smart accessories with interactive 3D models.",
};

async function ShopLoader() {
  const [initialData, categories, brands] = await Promise.all([
    getProductsServer("page_size=20"),
    getCategoriesServer(),
    getBrandsServer(),
  ]);

  return (
    <ShopCatalogClient
      initialData={initialData}
      categories={categories}
      brands={brands}
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-12 animate-pulse space-y-6">
          <div className="h-16 bg-neutral-200 rounded-xl w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-neutral-200 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ShopLoader />
    </Suspense>
  );
}
