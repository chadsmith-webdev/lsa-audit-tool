import { type Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing — Local Search Ally",
  description:
    "$49/mo for the full local SEO toolkit built for NWA contractors. 14-day free trial. Early adopter annual pricing locked for life.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{
    gate?: string;
    cancelled?: string;
    error?: string;
  }>;
}) {
  const { gate, cancelled, error } = await searchParams;
  return (
    <PricingClient
      gate={gate ?? null}
      cancelled={cancelled === "1"}
      error={error ?? null}
    />
  );
}
