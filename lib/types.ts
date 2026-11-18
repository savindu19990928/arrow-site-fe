export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  profile_photo?: string | null;
  role: UserRole;
  is_verified?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  created_at?: string;
}

export interface AuthSession {
  access: string;
  refresh: string;
  user: User;
}

export interface Address {
  id: number;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_or_province: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressPayload {
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_or_province?: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
  delivery_notes?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent: number | null;
  parent_name?: string | null;
  display_order: number;
  is_active: boolean;
  product_count: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  is_active: boolean;
  product_count: number;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
}

export interface ProductSpecification {
  id: number;
  group: string;
  key: string;
  value: string;
  display_order: number;
}

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  color: string | null;
  size: string | null;
  model_variant: string | null;
  battery_capacity: string | null;
  wheel_size: string | null;
  configuration: string | null;
  price_override: string | null;
  final_price: string;
  stock_quantity: number;
  in_stock: boolean;
  image: string | null;
  is_active: boolean;
}

export interface Product3DModel {
  id: number;
  name: string;
  has_3d_model: boolean;
  model_3d_file: string | null;
  model_3d_format: string | null;
  model_3d_poster: string | null;
  camera_orbit: string | null;
  field_of_view: string | null;
  auto_rotate: boolean;
  allow_zoom: boolean;
  environment_preset: string | null;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  price: string;
  compare_at_price: string | null;
  discount_percentage: number;
  stock_quantity: number;
  in_stock: boolean;
  category: Category;
  brand: Brand | null;
  primary_image: string | null;
  has_3d_model: boolean;
  is_featured: boolean;
  average_rating: string;
  review_count: number;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  warranty_information: string | null;
  estimated_arrival_days: number;
  images: ProductImage[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  viewer_3d: Product3DModel | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image: string | null;
  variant_id: number | null;
  variant_name: string | null;
  variant_sku: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Cart {
  id: number;
  guest_token: string | null;
  items: CartItem[];
  total_items_count: number;
  subtotal: string;
  estimated_delivery_fee: string;
  grand_total: string;
  max_lead_time_days: number;
  updated_at: string;
}

export interface WishlistItem {
  id: number;
  product: ProductListItem;
  created_at: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: number;
  discount_amount: number;
  discounted_subtotal: number;
  message: string;
}

export interface PromotionalCampaign {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  banner: string | null;
  discount_percentage: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_live: boolean;
}

export type PaymentMethod = "BANK_TRANSFER" | "KOKO" | "MINTPAY" | "CARD_ONLINE";
export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "CANCELLED" | "REFUNDED";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "HANDED_OVER"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface BankAccountInfo {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  swift_code: string;
}

export interface BankDetailsResponse {
  bank_accounts: BankAccountInfo[];
  instructions: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  variant_name: string | null;
  sku: string;
  product_image?: string | null;
  unit_price: string;
  quantity: number;
  total_price: string;
  warranty_snapshot: string | null;
}

export interface OrderStatusHistoryEntry {
  id: number;
  status: OrderStatus;
  note: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export interface OrderPaymentSummary {
  id: number;
  payment_method: PaymentMethod;
  amount: string;
  currency: string;
  status: PaymentStatus;
  transaction_id: string | null;
  reference_number: string;
  bank_slip_image: string | null;
  bank_name: string | null;
  deposit_date: string | null;
  customer_bank_reference: string | null;
  bank_transfer_submitted_at: string | null;
  is_bank_transfer_submitted: boolean;
  is_verified: boolean;
  verified_by_email: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPaymentRecord extends OrderPaymentSummary {
  order: number;
  order_number: string;
  order_status: OrderStatus;
}

export interface OrderListItem {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  total_amount: string;
  placed_at: string;
  estimated_arrival_date: string | null;
  items_count: number;
  customer_name: string;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  customer_name: string;
  customer_contact: string;
  shipping_recipient_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string | null;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: string;
  discount_amount: string;
  delivery_charge: string;
  total_amount: string;
  coupon_code: string | null;
  estimated_arrival_date: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  delivery_notes: string | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  items: OrderItem[];
  status_history: OrderStatusHistoryEntry[];
  payments: OrderPaymentSummary[];
  bank_transfer_details?: BankDetailsResponse | null;
}

export interface CheckoutPayload {
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_token?: string;
  shipping_recipient_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state?: string;
  shipping_postal_code: string;
  shipping_country: string;
  payment_method: PaymentMethod;
  coupon_code?: string;
  delivery_notes?: string;
}

export interface InitiatePaymentResponse {
  provider: string;
  payment_id: number;
  order_number: string;
  amount: number;
  currency?: string;
  installments?: number;
  installment_amount?: number;
  session_id?: string;
  token?: string;
  checkout_url?: string;
  message: string;
}

export interface BankSlipSubmitResponse {
  success: boolean;
  message: string;
  payment_id: number;
  status: PaymentStatus;
  order_number: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  customer_bank_reference: string;
  bank_transfer_submitted_at: string;
  bank_slip_image: string | null;
}

export interface CancellationRequest {
  id: number;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ReturnRefundRequest {
  id: number;
  order: number;
  order_item: number | null;
  type: "RETURN_AND_REFUND" | "REFUND_ONLY";
  refund_amount: string;
  reason: string;
  bank_details_for_refund: string | null;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ProductReview {
  id: number;
  product: number;
  user_name: string;
  rating: number;
  title: string;
  review_text: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface CustomerNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface CustomerNotificationsResponse {
  unread_count: number;
  notifications: CustomerNotification[];
}

export type AdminNotification = CustomerNotification;

export interface StockLevelProduct {
  id: number;
  sku: string;
  name: string;
  category_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export type StockMovementType =
  | "RESTOCK"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "CANCELLATION";

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  variant: number | null;
  variant_name: string | null;
  movement_type: StockMovementType;
  quantity: number;
  before_stock: number;
  after_stock: number;
  reason: string | null;
  reference_id: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface AdminDashboardSummary {
  today_revenue: number;
  month_to_date_revenue: number;
  active_orders_count: number;
  pending_bank_verifications_count: number;
  low_stock_alerts_count: number;
}

export interface AdminUserRecord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AdminCoupon {
  id: number;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}
