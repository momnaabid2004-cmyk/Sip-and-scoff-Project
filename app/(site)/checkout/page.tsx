import type { Metadata } from "next";
import { CheckoutClient } from "@/components/sections/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="container-site pb-20 pt-10 sm:pt-14">
      <CheckoutClient />
    </section>
  );
}
