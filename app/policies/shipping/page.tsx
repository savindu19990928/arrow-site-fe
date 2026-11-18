import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout } from "@/components/policies/PolicyLayout";
import {
  BUSINESS_INFO,
  FREE_DELIVERY_THRESHOLD_LKR,
  STANDARD_DELIVERY_FEE_LKR,
  formatLKR,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description:
    "Islandwide delivery rates, dispatch lead times, and courier tracking across Sri Lanka.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping & Delivery Policy" activeSlug="shipping">
      <h2>Islandwide Delivery Rates</h2>
      <ul>
        <li>
          <strong>Free Delivery:</strong> Orders of{" "}
          <strong>{formatLKR(FREE_DELIVERY_THRESHOLD_LKR)}</strong> or above
          ship free islandwide across Sri Lanka.
        </li>
        <li>
          <strong>Standard Delivery Fee:</strong> Orders under{" "}
          {formatLKR(FREE_DELIVERY_THRESHOLD_LKR)} carry a flat{" "}
          <strong>{formatLKR(STANDARD_DELIVERY_FEE_LKR)}</strong> delivery
          charge.
        </li>
      </ul>

      <h2>Payment Verification & Dispatch Timing</h2>
      <p>
        Orders remain in <strong>PENDING</strong> status until payment is
        verified (either instantly via Koko / Mintpay confirmation or upon staff
        approval of your uploaded Bank Transfer deposit slip). Once confirmed,
        in-stock cycles, parts, and accessories typically dispatch within 1–3
        business days depending on product lead time and pre-delivery safety
        inspection.
      </p>

      <h2>Delivery Tracking & Inspection</h2>
      <p>
        When handed over to our courier partners (such as Domex or Certis Lanka
        Courier), you receive a tracking number visible in your{" "}
        <Link href="/account" className="font-bold underline">
          Customer Portal
        </Link>{" "}
        and public{" "}
        <Link href="/track-order" className="font-bold underline">
          Track Order
        </Link>{" "}
        page. Please ensure an authorised recipient is present to receive and
        inspect bulky electric bicycle deliveries.
      </p>

      <h2>Special Handling for Lithium Batteries</h2>
      <p>
        High-capacity lithium batteries and electric bicycles require protective
        packaging and approved ground courier transport. Contact{" "}
        {BUSINESS_INFO.whatsapp} or {BUSINESS_INFO.supportEmail} for regional
        delivery scheduling questions.
      </p>
    </PolicyLayout>
  );
}
