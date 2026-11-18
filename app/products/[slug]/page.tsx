import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlugServer,
  getProductsServer,
  getRelatedProductsServer,
  getReviewsServer,
} from "@/lib/server-api";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

export async function generateStaticParams() {
  const data = await getProductsServer("page_size=50");
  return data.results.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugServer(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: product.name,
    description:
      product.short_description ||
      product.description ||
      `${product.name} available at Arrow Ventures Sri Lanka.`,
  };
}

async function ProductPageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, reviews, related] = await Promise.all([
    getProductBySlugServer(slug),
    getReviewsServer(slug),
    getRelatedProductsServer(slug),
  ]);

  if (!product) {
    notFound();
  }

  // If related returned empty, fallback to same category products excluding current
  let relatedList = related.filter((p) => p.id !== product.id);
  if (relatedList.length === 0 && product.category?.slug) {
    const fallback = await getProductsServer(
      `category=${encodeURIComponent(product.category.slug)}&page_size=5`
    );
    relatedList = fallback.results.filter((p) => p.id !== product.id);
  }

  return (
    <ProductDetailClient
      product={product}
      initialReviews={reviews}
      relatedProducts={relatedList}
    />
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 animate-pulse space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-[440px] bg-neutral-200 rounded-2xl" />
            <div className="lg:col-span-5 h-[440px] bg-neutral-200 rounded-2xl" />
          </div>
        </div>
      }
    >
      <ProductPageContent params={params} />
    </Suspense>
  );
}
