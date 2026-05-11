import { type Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing — Local Search Ally",
  description:
    "$49/mo for the full local SEO toolkit built for NWA contractors. 14-day free trial. Early adopter annual pricing locked for life.",
};

export default function PricingPage() {
  return <PricingClient />;
}
