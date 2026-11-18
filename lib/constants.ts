export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.arrowventures.lk";

export const FREE_DELIVERY_THRESHOLD_LKR = 100000;
export const STANDARD_DELIVERY_FEE_LKR = 2500;

export const BUSINESS_INFO = {
  name: "Arrow Ventures",
  legalName: "Arrow Ventures (Pvt) Ltd",
  website: "https://www.arrowventures.lk",
  supportEmail: "support@arrowventures.lk",
  privacyEmail: "privacy@arrowventures.lk",
  phone: "+94 11 269 4820",
  whatsapp: "+94 77 842 9100",
  address: "No. 248, Galle Road, Colombo 03, Sri Lanka",
  serviceHours: "Mon – Sat, 9:00 AM – 6:30 PM (SLST)",
  policyUpdated: "November 18, 2026",
  returnWindowDays: 7,
  refundProcessingBusinessDays: "5–7",
  exchangeWindowDays: 7,
} as const;

export function formatLKR(value: number | string | null | undefined, showDecimals = false): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(num)) return "Rs. 0";
  return `Rs. ${num.toLocaleString("en-LK", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}

export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD_LKR ? 0 : STANDARD_DELIVERY_FEE_LKR;
}

export function formatDateSL(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeSL(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SRI_LANKA_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "North Western Province",
  "Sabaragamuwa Province",
  "North Central Province",
  "Uva Province",
  "Eastern Province",
  "Northern Province",
] as const;

export const ORDER_STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed" },
  { key: "CONFIRMED", label: "Payment Confirmed" },
  { key: "PROCESSING", label: "Preparing" },
  { key: "PACKED", label: "Packed" },
  { key: "HANDED_OVER", label: "Courier Pickup" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

export const RIDER_AVATARS = [
  "/images/avatars/rider-1.png",
  "/images/avatars/rider-2.png",
  "/images/avatars/rider-3.png",
] as const;

export function pickSriLankanAvatar(name: string, index = 0): string {
  const lower = name.toLowerCase();
  if (
    lower.includes("nimali") ||
    lower.includes("sanduni") ||
    lower.includes("dilani") ||
    lower.includes("kavindi") ||
    lower.includes("tharushi") ||
    lower.includes("shani")
  ) {
    return "/images/avatars/rider-2.png";
  }
  return index % 2 === 0 ? "/images/avatars/rider-1.png" : "/images/avatars/rider-3.png";
}
