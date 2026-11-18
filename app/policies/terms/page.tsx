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
  title: "Terms & Conditions",
  description:
    "Terms and Conditions governing purchases, payments, e-bike safety, and warranty at Arrow Ventures.",
};

export default function TermsPolicyPage() {
  return (
    <PolicyLayout title="Terms & Conditions" activeSlug="terms">
      <h2>3.1 About these terms</h2>
      <p>
        Welcome to {BUSINESS_INFO.legalName}. These Terms and Conditions govern
        use of {BUSINESS_INFO.website} and purchases of electric bicycles, spare
        parts, batteries, and accessories. They should be read alongside our{" "}
        <Link href="/policies/returns" className="font-bold underline">
          Refund, Return and Exchange Policy
        </Link>{" "}
        and{" "}
        <Link href="/policies/privacy" className="font-bold underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2>3.2 Eligibility and customer accounts</h2>
      <ul>
        <li>
          You must be legally capable of entering into a binding purchase
          contract and provide accurate, current contact and delivery details.
        </li>
        <li>
          You are responsible for safeguarding your account password and
          notifying us immediately of any unauthorised access.
        </li>
      </ul>

      <h2>3.3 Product information, specs & 3D product viewer</h2>
      <p>
        Stated riding range, speed, and charging time figures are estimates and
        vary with rider weight, Sri Lankan hill terrain, weather, tyre pressure,
        and assist mode. Interactive 3D models help illustrate geometry and
        design, while the written specifications and confirmed invoice govern the
        final sale.
      </p>

      <h2>3.4 Prices, availability & delivery charges</h2>
      <p>
        All prices are displayed in Sri Lankan Rupees (LKR). Orders totaling{" "}
        <strong>{formatLKR(FREE_DELIVERY_THRESHOLD_LKR)} or more</strong>{" "}
        qualify for free islandwide delivery; orders below that threshold incur a
        flat <strong>{formatLKR(STANDARD_DELIVERY_FEE_LKR)}</strong> delivery fee,
        clearly itemized before order placement.
      </p>

      <h2>3.5 Orders & payment verification</h2>
      <p>
        Placing an order constitutes an offer to purchase. For Direct Bank
        Transfers, orders remain in <strong>PENDING</strong> status until payment
        verification is completed against your uploaded receipt and our bank
        statement. For Koko and Mintpay BNPL, transactions are subject to
        provider authorisation.
      </p>

      <h2>3.6 Electric bicycle & lithium battery safety</h2>
      <ul>
        <li>
          Check brakes, tyres, lights, steering, and fasteners before every
          ride, wear an approved helmet, and comply with applicable Sri Lankan
          road traffic laws.
        </li>
        <li>
          Use only the approved charger supplied or specified for your battery.
          Never open, puncture, or continue charging a damaged or unusually hot
          lithium-ion battery.
        </li>
        <li>
          Ensure specialist electrical or drivetrain parts are installed safely
          by qualified technicians.
        </li>
      </ul>

      <h2>3.7 Intellectual property & liability</h2>
      <p>
        Website logos, photography, 3D assets, and brand marks belong to Arrow
        Ventures or their respective rights holders (such as Shimano, Kenda, and
        Bosch). Nothing in these terms excludes non-excludable consumer rights.
      </p>

      <h2>3.8 Governing law & contact</h2>
      <p>
        These Terms and Conditions are governed by the laws of{" "}
        <strong>Sri Lanka</strong>. For support or dispute resolution, contact{" "}
        {BUSINESS_INFO.supportEmail}, {BUSINESS_INFO.whatsapp}, or visit{" "}
        {BUSINESS_INFO.address}.
      </p>
    </PolicyLayout>
  );
}
