import { API_BASE_URL } from "./constants";
import type {
  Address,
  AddressPayload,
  AdminCoupon,
  AdminDashboardSummary,
  AdminNotification,
  AdminPaymentRecord,
  AdminUserRecord,
  AuthSession,
  BankDetailsResponse,
  BankSlipSubmitResponse,
  Brand,
  CancellationRequest,
  Cart,
  Category,
  CheckoutPayload,
  CouponValidationResponse,
  CustomerNotificationsResponse,
  InitiatePaymentResponse,
  OrderDetail,
  OrderListItem,
  OrderStatus,
  PaginatedResponse,
  PaymentMethod,
  PaymentStatus,
  Product3DModel,
  ProductDetail,
  ProductListItem,
  ProductReview,
  PromotionalCampaign,
  ReturnRefundRequest,
  StockLevelProduct,
  StockMovement,
  StockMovementType,
  User,
  WishlistItem,
} from "./types";

const AUTH_STORAGE_KEY = "arrow_auth_session_v1";
const GUEST_TOKEN_KEY = "arrow_guest_token_v1";

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code?: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.access) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(GUEST_TOKEN_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(GUEST_TOKEN_KEY, generated);
  return generated;
}

export function clearGuestToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_TOKEN_KEY);
}

export function unwrapList<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function parseErrorPayload(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const detail =
      (typeof p.detail === "string" && p.detail) ||
      (typeof p.message === "string" && p.message) ||
      (typeof p.error === "string" && p.error);
    const errors =
      p.errors && typeof p.errors === "object"
        ? (p.errors as Record<string, string[]>)
        : undefined;

    if (detail) {
      return new ApiError(
        detail,
        status,
        typeof p.code === "string" ? p.code : undefined,
        errors
      );
    }

    // DRF field-level error fallback
    const fieldMsgs: string[] = [];
    for (const [key, val] of Object.entries(p)) {
      if (key === "success" || key === "code") continue;
      if (Array.isArray(val)) {
        fieldMsgs.push(`${key}: ${val.join(" ")}`);
      } else if (typeof val === "string") {
        fieldMsgs.push(`${key}: ${val}`);
      }
    }
    if (fieldMsgs.length > 0) {
      return new ApiError(fieldMsgs.join(" | "), status, undefined, errors);
    }
  }
  return new ApiError(`Request failed with status ${status}`, status);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const session = getStoredSession();
  if (!session?.refresh) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: session.refresh }),
      });
      if (!res.ok) {
        setStoredSession(null);
        return null;
      }
      const data = (await res.json()) as { access?: string; refresh?: string };
      if (!data?.access) {
        setStoredSession(null);
        return null;
      }
      const updated: AuthSession = {
        ...session,
        access: data.access,
        refresh: data.refresh ?? session.refresh,
      };
      setStoredSession(updated);
      return data.access;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  includeGuestToken?: boolean;
  isMultipart?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    auth = true,
    includeGuestToken = false,
    isMultipart = false,
    headers: customHeaders,
    ...init
  } = options;

  const buildHeaders = (tokenOverride?: string | null): Headers => {
    const h = new Headers(customHeaders);
    if (!isMultipart && body !== undefined && !h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
    const session = getStoredSession();
    const token = tokenOverride ?? (auth ? session?.access : undefined);
    if (token) {
      h.set("Authorization", `Bearer ${token}`);
    }
    if (includeGuestToken && !token && typeof window !== "undefined") {
      const guestToken = getOrCreateGuestToken();
      if (guestToken) {
        h.set("X-Guest-Token", guestToken);
      }
    }
    return h;
  };

  const serializeBody = (): BodyInit | undefined => {
    if (body === undefined) return undefined;
    if (isMultipart || body instanceof FormData) return body as FormData;
    return JSON.stringify(body);
  };

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  let response = await fetch(url, {
    ...init,
    headers: buildHeaders(),
    body: serializeBody(),
  });

  if (response.status === 401 && auth && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(url, {
        ...init,
        headers: buildHeaders(newToken),
        body: serializeBody(),
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    throw parseErrorPayload(response.status, payload);
  }

  return payload as T;
}

export async function apiDownloadBlob(
  path: string,
  auth = true
): Promise<{ blob: Blob; filename?: string }> {
  const session = getStoredSession();
  const headers = new Headers();
  if (auth && session?.access) {
    headers.set("Authorization", `Bearer ${session.access}`);
  }
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  let res = await fetch(url, { headers });

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { headers });
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // ignore non-json error body
    }
    throw parseErrorPayload(res.status, parsed);
  }

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const blob = await res.blob();
  return { blob, filename: match?.[1] };
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      sp.set(k, String(v));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

// ============================================================================
// 4.1 Authentication & Accounts
// ============================================================================

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    const raw = await apiFetch<Record<string, unknown>>("/api/auth/login/", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    const inner = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
    const access = String(inner.access ?? "");
    const refresh = String(inner.refresh ?? "");
    const user = inner.user as User;
    if (!access || !user) {
      throw new ApiError("Unexpected login response from server.", 500);
    }
    return { access, refresh, user };
  },

  async register(payload: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  }): Promise<AuthSession> {
    const raw = await apiFetch<Record<string, unknown>>("/api/auth/register/", {
      method: "POST",
      auth: false,
      body: payload,
    });
    const inner = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
    if (inner.access && inner.user) {
      return {
        access: String(inner.access),
        refresh: String(inner.refresh ?? ""),
        user: inner.user as User,
      };
    }
    // Fallback auto-login if register endpoint omits JWT pair
    return authApi.login(payload.email, payload.password);
  },

  getProfile(): Promise<User> {
    return apiFetch<User>("/api/auth/profile/");
  },

  updateProfile(payload: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }): Promise<User> {
    return apiFetch<User>("/api/auth/profile/", {
      method: "PATCH",
      body: payload,
    });
  },

  changePassword(payload: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiFetch("/api/auth/change-password/", {
      method: "POST",
      body: payload,
    });
  },
};

// ============================================================================
// 4.2 Customer Saved Addresses
// ============================================================================

export const addressApi = {
  async list(): Promise<Address[]> {
    const data = await apiFetch<Address[] | PaginatedResponse<Address>>("/api/addresses/");
    return unwrapList(data);
  },
  create(payload: AddressPayload): Promise<Address> {
    return apiFetch<Address>("/api/addresses/", { method: "POST", body: payload });
  },
  update(id: number, payload: Partial<AddressPayload>): Promise<Address> {
    return apiFetch<Address>(`/api/addresses/${id}/`, { method: "PATCH", body: payload });
  },
  remove(id: number): Promise<void> {
    return apiFetch<void>(`/api/addresses/${id}/`, { method: "DELETE" });
  },
  setDefault(id: number): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/addresses/${id}/set-default/`, { method: "POST" });
  },
};

// ============================================================================
// 4.3 Product Catalog & 3D Interactive Viewing
// ============================================================================

export interface ProductQueryParams {
  category?: string;
  brand?: string;
  min_price?: number | string;
  max_price?: number | string;
  in_stock?: boolean;
  has_3d_model?: boolean;
  is_featured?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const catalogApi = {
  async getCategories(): Promise<Category[]> {
    const data = await apiFetch<Category[] | PaginatedResponse<Category>>(
      "/api/catalog/categories/",
      { auth: false }
    );
    return unwrapList(data);
  },
  async getBrands(): Promise<Brand[]> {
    const data = await apiFetch<Brand[] | PaginatedResponse<Brand>>(
      "/api/catalog/brands/",
      { auth: false }
    );
    return unwrapList(data);
  },
  getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<ProductListItem>> {
    const qs = buildQuery(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<PaginatedResponse<ProductListItem>>(`/api/catalog/products/${qs}`, {
      auth: false,
    });
  },
  getProduct(slug: string): Promise<ProductDetail> {
    return apiFetch<ProductDetail>(`/api/catalog/products/${encodeURIComponent(slug)}/`, {
      auth: false,
    });
  },
  getProduct3D(slug: string): Promise<Product3DModel> {
    return apiFetch<Product3DModel>(
      `/api/catalog/products/${encodeURIComponent(slug)}/3d-model/`,
      { auth: false }
    );
  },
  async getRelatedProducts(slug: string): Promise<ProductListItem[]> {
    const data = await apiFetch<ProductListItem[] | PaginatedResponse<ProductListItem>>(
      `/api/catalog/products/${encodeURIComponent(slug)}/related/`,
      { auth: false }
    );
    return unwrapList(data);
  },
};

// ============================================================================
// 4.4 Shopping Cart & Wishlist
// ============================================================================

export const cartApi = {
  getCart(): Promise<Cart> {
    return apiFetch<Cart>("/api/cart/", { includeGuestToken: true });
  },
  addItem(payload: {
    product_id: number;
    variant_id?: number | null;
    quantity: number;
  }): Promise<Cart> {
    return apiFetch<Cart>("/api/cart/", {
      method: "POST",
      includeGuestToken: true,
      body: {
        product_id: payload.product_id,
        ...(payload.variant_id ? { variant_id: payload.variant_id } : {}),
        quantity: payload.quantity,
      },
    });
  },
  updateItem(itemId: number, quantity: number): Promise<Cart> {
    return apiFetch<Cart>(`/api/cart/items/${itemId}/`, {
      method: "PATCH",
      includeGuestToken: true,
      body: { quantity },
    });
  },
  removeItem(itemId: number): Promise<Cart> {
    return apiFetch<Cart>(`/api/cart/items/${itemId}/`, {
      method: "DELETE",
      includeGuestToken: true,
    });
  },
  clearCart(): Promise<{ success: boolean; message: string }> {
    return apiFetch("/api/cart/", {
      method: "DELETE",
      includeGuestToken: true,
    });
  },
  mergeCart(guestToken: string): Promise<Cart> {
    return apiFetch<Cart>("/api/cart/merge/", {
      method: "POST",
      body: { guest_token: guestToken },
    });
  },
};

export const wishlistApi = {
  async list(): Promise<WishlistItem[]> {
    const data = await apiFetch<WishlistItem[] | PaginatedResponse<WishlistItem>>(
      "/api/wishlist/"
    );
    return unwrapList(data);
  },
  toggle(productId: number): Promise<{ success: boolean; added: boolean; message: string }> {
    return apiFetch("/api/wishlist/", {
      method: "POST",
      body: { product_id: productId },
    });
  },
};

// ============================================================================
// 4.5 Promotions & Coupon Codes
// ============================================================================

export const promotionsApi = {
  validateCoupon(code: string, subtotal: number): Promise<CouponValidationResponse> {
    return apiFetch<CouponValidationResponse>("/api/promotions/coupons/validate/", {
      method: "POST",
      auth: false,
      body: { code, subtotal },
    });
  },
  async getCampaigns(): Promise<PromotionalCampaign[]> {
    const data = await apiFetch<
      PromotionalCampaign[] | PaginatedResponse<PromotionalCampaign>
    >("/api/promotions/campaigns/", { auth: false });
    return unwrapList(data);
  },
};

// ============================================================================
// 4.6 Orders, Checkout & PDF Invoices
// ============================================================================

export const ordersApi = {
  checkout(payload: CheckoutPayload): Promise<OrderDetail> {
    return apiFetch<OrderDetail>("/api/orders/checkout/", {
      method: "POST",
      includeGuestToken: true,
      body: payload,
    });
  },
  list(params?: { page?: number; status?: string }): Promise<PaginatedResponse<OrderListItem>> {
    const qs = buildQuery(params);
    return apiFetch<PaginatedResponse<OrderListItem>>(`/api/orders/${qs}`);
  },
  getDetail(id: number): Promise<OrderDetail> {
    return apiFetch<OrderDetail>(`/api/orders/${id}/`);
  },
  track(orderNumber: string, contact: string): Promise<OrderDetail> {
    const qs = buildQuery({ order_number: orderNumber, contact });
    return apiFetch<OrderDetail>(`/api/orders/track/${qs}`, { auth: false });
  },
  downloadInvoice(id: number, contact?: string): Promise<{ blob: Blob; filename?: string }> {
    const qs = contact ? buildQuery({ contact }) : "";
    return apiDownloadBlob(`/api/orders/${id}/invoice/${qs}`, !contact);
  },
  cancelOrder(id: number, reason: string): Promise<CancellationRequest> {
    return apiFetch<CancellationRequest>(`/api/orders/${id}/cancel/`, {
      method: "POST",
      body: { reason },
    });
  },
  requestReturnRefund(
    id: number,
    payload: {
      order_item?: number | null;
      type: "RETURN_AND_REFUND" | "REFUND_ONLY";
      refund_amount: number | string;
      reason: string;
      bank_details_for_refund: string;
    }
  ): Promise<ReturnRefundRequest> {
    return apiFetch<ReturnRefundRequest>(`/api/orders/${id}/return-refund/`, {
      method: "POST",
      body: payload,
    });
  },
};

// ============================================================================
// 4.7 Payments
// ============================================================================

export const paymentsApi = {
  getBankDetails(): Promise<BankDetailsResponse> {
    return apiFetch<BankDetailsResponse>("/api/payments/bank-details/", { auth: false });
  },
  initiate(payload: {
    order_number: string;
    payment_method: PaymentMethod;
    contact?: string;
  }): Promise<InitiatePaymentResponse> {
    return apiFetch<InitiatePaymentResponse>("/api/payments/initiate/", {
      method: "POST",
      body: payload,
    });
  },
  submitBankSlip(formData: FormData): Promise<BankSlipSubmitResponse> {
    return apiFetch<BankSlipSubmitResponse>("/api/payments/bank-transfer/submit-slip/", {
      method: "POST",
      isMultipart: true,
      body: formData,
    });
  },
};

// ============================================================================
// 4.9 Reviews & 4.10 Notifications
// ============================================================================

export const reviewsApi = {
  list(params?: { product_slug?: string; product_id?: number; page?: number }): Promise<
    PaginatedResponse<ProductReview>
  > {
    const qs = buildQuery(params);
    return apiFetch<PaginatedResponse<ProductReview>>(`/api/reviews/${qs}`, { auth: false });
  },
  submit(payload: {
    product: number;
    rating: number;
    title: string;
    review_text: string;
  }): Promise<ProductReview> {
    return apiFetch<ProductReview>("/api/reviews/submit/", {
      method: "POST",
      body: payload,
    });
  },
};

export const notificationsApi = {
  list(): Promise<CustomerNotificationsResponse> {
    return apiFetch<CustomerNotificationsResponse>("/api/notifications/");
  },
  markRead(id: number): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/notifications/${id}/mark-read/`, { method: "POST" });
  },
  markAllRead(): Promise<{ success: boolean; message: string }> {
    return apiFetch("/api/notifications/mark-all-read/", { method: "POST" });
  },
};

// ============================================================================
// Admin & Staff Endpoints
// ============================================================================

export const adminApi = {
  // Dashboard & Reports
  getDashboardSummary(): Promise<AdminDashboardSummary> {
    return apiFetch<AdminDashboardSummary>("/api/admin/reports/dashboard-summary/");
  },
  getReport<T = Record<string, unknown>>(
    reportSlug:
      | "product-sales"
      | "orders"
      | "payments"
      | "income"
      | "inventory"
      | "customer-purchases"
      | "discounts-promotions"
      | "cancellations-refunds",
    params?: { start_date?: string; end_date?: string }
  ): Promise<T> {
    const qs = buildQuery(params);
    return apiFetch<T>(`/api/admin/reports/${reportSlug}/${qs}`);
  },
  exportReportCsv(
    reportSlug: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<{ blob: Blob; filename?: string }> {
    const qs = buildQuery({ ...params, export: "csv" });
    return apiDownloadBlob(`/api/admin/reports/${reportSlug}/${qs}`, true);
  },

  // Notifications
  async getNotifications(): Promise<AdminNotification[]> {
    const data = await apiFetch<
      AdminNotification[] | PaginatedResponse<AdminNotification>
    >("/api/admin/notifications/");
    return unwrapList(data);
  },

  // Orders
  getOrders(params?: {
    status?: string;
    payment_status?: string;
    payment_method?: string;
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<OrderDetail>> {
    const qs = buildQuery(params);
    return apiFetch<PaginatedResponse<OrderDetail>>(`/api/admin/orders/${qs}`);
  },
  getOrderDetail(id: number): Promise<OrderDetail> {
    return apiFetch<OrderDetail>(`/api/admin/orders/${id}/`);
  },
  updateOrderStatus(
    id: number,
    payload: {
      status: OrderStatus;
      courier_name?: string;
      tracking_number?: string;
      note?: string;
    }
  ): Promise<OrderDetail> {
    return apiFetch<OrderDetail>(`/api/admin/orders/${id}/update-status/`, {
      method: "POST",
      body: payload,
    });
  },

  // Payments & Bank Verification
  getPayments(params?: {
    payment_method?: PaymentMethod | "";
    status?: PaymentStatus | "";
    submitted?: boolean | string;
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<AdminPaymentRecord>> {
    const qs = buildQuery(params);
    return apiFetch<PaginatedResponse<AdminPaymentRecord>>(`/api/admin/payments/${qs}`);
  },
  getPendingVerifications(page?: number): Promise<PaginatedResponse<AdminPaymentRecord>> {
    const qs = buildQuery({ page });
    return apiFetch<PaginatedResponse<AdminPaymentRecord>>(
      `/api/admin/payments/pending-verifications/${qs}`
    );
  },
  verifyBankPayment(
    id: number,
    payload: {
      action: "APPROVE" | "REJECT";
      transaction_id?: string;
      admin_notes?: string;
      confirm_without_slip?: boolean;
    }
  ): Promise<AdminPaymentRecord> {
    return apiFetch<AdminPaymentRecord>(`/api/admin/payments/${id}/verify/`, {
      method: "POST",
      body: payload,
    });
  },
  getBankDetails(): Promise<BankDetailsResponse> {
    return apiFetch<BankDetailsResponse>("/api/admin/payments/bank-details/");
  },
  updateBankDetails(payload: BankDetailsResponse): Promise<BankDetailsResponse> {
    return apiFetch<BankDetailsResponse>("/api/admin/payments/bank-details/", {
      method: "PUT",
      body: payload,
    });
  },

  // Inventory
  getStockLevels(params?: {
    low_stock?: boolean;
    out_of_stock?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<StockLevelProduct>> {
    const qs = buildQuery(params);
    return apiFetch<PaginatedResponse<StockLevelProduct>>(
      `/api/admin/inventory/stock-levels/${qs}`
    );
  },
  getStockMovements(params?: {
    page?: number;
    search?: string;
  }): Promise<PaginatedResponse<StockMovement>> {
    const qs = buildQuery(params);
    return apiFetch<PaginatedResponse<StockMovement>>(
      `/api/admin/inventory/movements/${qs}`
    );
  },
  adjustStock(payload: {
    product_id: number;
    variant_id?: number | null;
    quantity: number;
    movement_type: StockMovementType;
    reason: string;
  }): Promise<StockMovement> {
    return apiFetch<StockMovement>("/api/admin/inventory/adjust/", {
      method: "POST",
      body: payload,
    });
  },

  // Cancellations & Returns
  getCancellations(params?: { page?: number; search?: string }): Promise<
    PaginatedResponse<CancellationRequest & { order?: number; order_number?: string }>
  > {
    const qs = buildQuery(params);
    return apiFetch(`/api/admin/cancellations/${qs}`);
  },
  approveCancellation(id: number, adminNote: string): Promise<CancellationRequest> {
    return apiFetch(`/api/admin/cancellations/${id}/approve/`, {
      method: "POST",
      body: { reason: adminNote || "Approved by admin" },
    });
  },
  rejectCancellation(id: number, adminNote: string): Promise<CancellationRequest> {
    return apiFetch(`/api/admin/cancellations/${id}/reject/`, {
      method: "POST",
      body: { reason: adminNote || "Rejected by admin" },
    });
  },
  getReturnsRefunds(params?: { page?: number; search?: string }): Promise<
    PaginatedResponse<ReturnRefundRequest>
  > {
    const qs = buildQuery(params);
    return apiFetch(`/api/admin/returns-refunds/${qs}`);
  },
  resolveReturnRefund(
    id: number,
    payload: {
      status?: string;
      admin_note?: string;
      type?: "RETURN_AND_REFUND" | "REFUND_ONLY";
      refund_amount?: string | number;
      reason?: string;
    }
  ): Promise<ReturnRefundRequest> {
    return apiFetch(`/api/admin/returns-refunds/${id}/resolve/`, {
      method: "POST",
      body: payload,
    });
  },

  // Admin Catalog, Promotions, Reviews, Users
  getAdminProducts(params?: { page?: number; search?: string }): Promise<
    PaginatedResponse<ProductDetail & { cost_price?: string | null; is_active?: boolean }>
  > {
    const qs = buildQuery(params);
    return apiFetch(`/api/admin/catalog/products/${qs}`);
  },
  updateAdminProduct(id: number, payload: Record<string, unknown>): Promise<ProductDetail> {
    return apiFetch(`/api/admin/catalog/products/${id}/`, {
      method: "PATCH",
      body: payload,
    });
  },
  getAdminCoupons(page?: number): Promise<PaginatedResponse<AdminCoupon>> {
    const qs = buildQuery({ page });
    return apiFetch(`/api/admin/promotions/coupons/${qs}`);
  },
  getAdminCampaigns(page?: number): Promise<PaginatedResponse<PromotionalCampaign>> {
    const qs = buildQuery({ page });
    return apiFetch(`/api/admin/promotions/campaigns/${qs}`);
  },
  getAdminReviews(page?: number): Promise<PaginatedResponse<ProductReview>> {
    const qs = buildQuery({ page });
    return apiFetch(`/api/admin/reviews/${qs}`);
  },
  deleteAdminReview(id: number): Promise<void> {
    return apiFetch(`/api/admin/reviews/${id}/`, { method: "DELETE" });
  },
  getAdminUsers(page?: number): Promise<PaginatedResponse<AdminUserRecord>> {
    const qs = buildQuery({ page });
    return apiFetch(`/api/admin/users/${qs}`);
  },
};
