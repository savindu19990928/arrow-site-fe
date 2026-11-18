import { cacheLife } from "next/cache";
import { API_BASE_URL } from "./constants";
import type {
  Brand,
  Category,
  PaginatedResponse,
  ProductDetail,
  ProductListItem,
  ProductReview,
  PromotionalCampaign,
} from "./types";

async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function unwrap<T>(data: T[] | PaginatedResponse<T> | null): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

export async function getCategoriesServer(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  const data = await serverGet<Category[] | PaginatedResponse<Category>>(
    "/api/catalog/categories/"
  );
  return unwrap(data);
}

export async function getBrandsServer(): Promise<Brand[]> {
  "use cache";
  cacheLife("minutes");
  const data = await serverGet<Brand[] | PaginatedResponse<Brand>>(
    "/api/catalog/brands/"
  );
  return unwrap(data);
}

export async function getCampaignsServer(): Promise<PromotionalCampaign[]> {
  "use cache";
  cacheLife("minutes");
  const data = await serverGet<
    PromotionalCampaign[] | PaginatedResponse<PromotionalCampaign>
  >("/api/promotions/campaigns/");
  return unwrap(data);
}

export async function getProductsServer(queryString = ""): Promise<PaginatedResponse<ProductListItem>> {
  "use cache";
  cacheLife("minutes");
  const suffix = queryString ? `?${queryString}` : "";
  const data = await serverGet<PaginatedResponse<ProductListItem>>(
    `/api/catalog/products/${suffix}`
  );
  return data ?? { count: 0, next: null, previous: null, results: [] };
}

export async function getProductBySlugServer(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  return serverGet<ProductDetail>(`/api/catalog/products/${encodeURIComponent(slug)}/`);
}

export async function getRelatedProductsServer(slug: string): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("minutes");
  const data = await serverGet<ProductListItem[] | PaginatedResponse<ProductListItem>>(
    `/api/catalog/products/${encodeURIComponent(slug)}/related/`
  );
  return unwrap(data);
}

export async function getReviewsServer(productSlug?: string): Promise<ProductReview[]> {
  "use cache";
  cacheLife("minutes");
  const qs = productSlug ? `?product_slug=${encodeURIComponent(productSlug)}` : "";
  const data = await serverGet<PaginatedResponse<ProductReview>>(`/api/reviews/${qs}`);
  return unwrap(data);
}
