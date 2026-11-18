import React from "react";
import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/PolicyLayout";
import { BUSINESS_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Refund, Return and Exchange Policy",
  description:
    "Arrow Ventures refund, return, exchange, warranty, and lithium battery return guidance.",
};

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout
      title="Refund, Return & Exchange Policy"
      activeSlug="returns"
    >
      <h2>1.1 Our commitment</h2>
      <p>
        Thank you for shopping with Arrow Ventures. We sell electric bicycles,
        bicycle parts, components, and accessories. We want you to receive
        products that match your order and are in the condition described on our
        website. This policy applies to purchases made through{" "}
        {BUSINESS_INFO.website}, subject always to any consumer rights that
        cannot legally be excluded or limited.
      </p>

      <h2>1.2 Contact us before returning an item</h2>
      <p>
        Please contact our support team before sending or bringing an item back.
        Include your order number, name used for the order, product name and
        quantity, description of the issue, and clear photographs or a video
        where relevant.
      </p>
      <ul>
        <li>
          <strong>Return/Support Email:</strong> {BUSINESS_INFO.supportEmail}
        </li>
        <li>
          <strong>Telephone / WhatsApp:</strong> {BUSINESS_INFO.whatsapp} /{" "}
          {BUSINESS_INFO.phone}
        </li>
        <li>
          <strong>Return / Service Location:</strong> {BUSINESS_INFO.address}
        </li>
      </ul>
      <p>
        Please do not send a product to an address before receiving return
        instructions from us.
      </p>

      <h2>1.3 Change-of-mind returns</h2>
      <p>
        A return requested because you changed your mind may be accepted within{" "}
        <strong>{BUSINESS_INFO.returnWindowDays} days</strong> of delivery,
        provided that:
      </p>
      <ul>
        <li>
          The product is unused, uninstalled, unmodified, and in resalable
          condition.
        </li>
        <li>
          It is returned with its original packaging, accessories, manuals,
          keys, chargers, tools, and supplied items.
        </li>
        <li>
          There are no signs of use, damage, attempted repair, or misuse, and
          proof of purchase is provided.
        </li>
      </ul>
      <p>
        For hygiene, safety, and product-integrity reasons, helmets, personal
        protective equipment, electrical components, batteries, and custom-ordered
        items may not be eligible for change-of-mind returns once opened, used,
        installed, or fitted.
      </p>

      <h2>1.4 Electric bicycles that have been used or assembled</h2>
      <p>
        An electric bicycle that has been ridden, assembled beyond what is
        necessary for inspection, modified, or activated may not qualify for a
        change-of-mind return. If an electric bicycle or component is faulty,
        damaged, or incorrectly supplied, contact us immediately.
      </p>
      <ul>
        <li>
          Stop using it if you suspect a battery, motor, wiring, brake, frame, or
          other safety-related fault.
        </li>
        <li>
          Do not continue charging or operating a battery that is swollen,
          leaking, unusually hot, or visibly damaged.
        </li>
        <li>
          Do not dismantle or attempt unauthorised repairs before contacting us.
        </li>
      </ul>

      <h2>1.5 Parts and accessories</h2>
      <p>
        Check dimensions, connector type, voltage, and mounting standards before
        ordering parts. If a part is incompatible due to inaccurate website
        information supplied by Arrow Ventures, we will resolve it; otherwise
        change-of-mind rules under Section 1.3 apply.
      </p>

      <h2>1.6 Damaged, defective, incorrect, or missing items</h2>
      <p>
        Inspect your order promptly after delivery. If an item arrives damaged,
        defective, incorrect, or incomplete, send photos of the product, affected
        area, packaging, and shipping label so we can arrange repair,
        replacement, exchange, or refund.
      </p>

      <h2>1.7 Warranty claims</h2>
      <p>
        The warranty applicable to a product is the warranty stated on its
        listing, invoice, and warranty documentation. Please retain your PDF
        invoice. Warranties do not cover misuse, accidents, water exposure
        beyond rated IP limits, overloading, unauthorised modifications, or
        incompatible chargers. Contact {BUSINESS_INFO.supportEmail} or{" "}
        {BUSINESS_INFO.whatsapp} with your order details to initiate a claim.
      </p>

      <h2>1.8 Return shipping & lithium battery safety</h2>
      <p>
        For approved change-of-mind returns, the customer covers return shipping
        unless stated otherwise. If the return is due to our error or a valid
        defect, Arrow Ventures will coordinate return logistics.
      </p>
      <p className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950">
        <strong>Important – Lithium Batteries:</strong> Electric-bike batteries
        and other lithium packs are subject to special transport and packaging
        rules. Do not send a lithium battery through an ordinary courier without
        first receiving our return handling instructions.
      </p>

      <h2>1.9 Refund method, processing & exchanges</h2>
      <p>
        Once returned items are received and inspected, approved refunds are
        initiated within{" "}
        <strong>{BUSINESS_INFO.refundProcessingBusinessDays} business days</strong>{" "}
        to the original payment method (or direct Sri Lankan bank transfer where
        applicable). Exchanges may be requested within{" "}
        <strong>{BUSINESS_INFO.exchangeWindowDays} days</strong> of delivery
        subject to stock availability and condition.
      </p>

      <h2>1.10 Order cancellations</h2>
      <p>
        You may request cancellation from your Customer Portal before the order
        is packed and handed to our courier. If already dispatched, cancellation
        follows the return procedure above.
      </p>
    </PolicyLayout>
  );
}
