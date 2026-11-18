import React, { Suspense } from "react";
import type { Metadata } from "next";
import {
  Barlow_Condensed,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartDrawer } from "@/components/ui/CartDrawer";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "Arrow Ventures | Premium Electric Cycles & Parts in Sri Lanka",
    template: "%s | Arrow Ventures",
  },
  description:
    "Shop high-performance electric bicycles, lithium batteries, genuine spare parts, and safety gear across Sri Lanka with interactive 3D viewing, Koko, Mintpay, and Bank Transfer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#0B0B0D]">
        <StoreProvider>
          <Suspense fallback={<div className="h-[108px] bg-white border-b border-neutral-200" />}>
            <SiteHeader />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
