import React from "react";
import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/PolicyLayout";
import { BUSINESS_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Arrow Ventures collects, uses, protects, and retains personal data across Sri Lanka.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" activeSlug="privacy">
      <h2>2.1 Introduction</h2>
      <p>
        {BUSINESS_INFO.legalName} (&quot;Arrow Ventures&quot;) respects your
        privacy and handles your personal information responsibly when you visit{" "}
        {BUSINESS_INFO.website}, create an account, place an order, or interact
        with our services.
      </p>

      <h2>2.2 Information we collect</h2>
      <ul>
        <li>
          <strong>Information you provide:</strong> Name, email, phone number,
          delivery and billing addresses, order details, deposit slip receipts,
          reviews, warranty inquiries, and support messages.
        </li>
        <li>
          <strong>Payment information:</strong> Payments via Koko and Mintpay are
          processed by third-party payment providers; full card/BNPL credentials
          are handled by those providers and are not stored on Arrow Ventures
          servers. For bank transfers, we record your uploaded deposit slip,
          transfer reference, and deposit date solely for payment verification.
        </li>
        <li>
          <strong>Automatically collected technical data:</strong> Device/browser
          metadata, session identifiers (such as guest cart tokens), IP address,
          and interaction events needed to keep your shopping cart, 3D viewer,
          and website security working reliably.
        </li>
      </ul>

      <h2>2.3 How we use your information</h2>
      <ul>
        <li>Create and manage customer accounts and saved addresses.</li>
        <li>
          Process orders, verify bank transfer slips, arrange islandwide
          delivery, and issue official PDF invoices.
        </li>
        <li>
          Provide order updates, notifications, after-sales support, returns, and
          warranty assistance.
        </li>
        <li>
          Prevent fraud, verify stock integrity, and meet legal and accounting
          obligations in Sri Lanka.
        </li>
      </ul>

      <h2>2.4 Sharing information with third parties</h2>
      <p>
        We do not sell your personal information. We share only necessary data
        with trusted partners such as payment processors (Koko, Mintpay, and
        Sri Lankan banking partners), islandwide courier services, cloud storage
        & hosting providers, and authorised warranty service centers.
      </p>

      <h2>2.5 Cookies & local storage</h2>
      <p>
        Essential browser storage and cookies keep your guest or authenticated
        shopping cart, session tokens, and navigation preferences working
        smoothly. Disabling browser storage may affect cart persistence and
        checkout.
      </p>

      <h2>2.6 Interactive 3D product viewer</h2>
      <p>
        Selected product pages render interactive 3D and AR models using{" "}
        <code>@google/model-viewer</code> directly in your browser using public
        assets hosted on Google Cloud Storage.
      </p>

      <h2>2.7 Data security, retention & your rights</h2>
      <p>
        We employ TLS encryption, JWT authentication, and access controls to
        safeguard customer data. We retain records as long as needed for order
        fulfilment, warranty administration, and Sri Lankan statutory accounting.
        You may request access, correction, or deletion of your personal data by
        contacting <strong>{BUSINESS_INFO.privacyEmail}</strong> or{" "}
        <strong>{BUSINESS_INFO.phone}</strong>.
      </p>
    </PolicyLayout>
  );
}
