import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { getUserPlan, hasProAccess } from "@/lib/subscription";
import StartTrialButton from "./StartTrialButton";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";

export const metadata: Metadata = {
  title: "Start Free Trial — Local Search Ally",
  description:
    "Start your 14-day Pro trial. No charge for 14 days. Cancel anytime.",
};

type Tier = "pro" | "agency";
type Billing = "monthly" | "annual";

const PLAN_DETAILS: Record<
  Tier,
  { name: string; monthly: number; annual: number }
> = {
  pro: { name: "Pro", monthly: 49, annual: 441 },
  agency: { name: "Agency", monthly: 199, annual: 1791 },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  const { plan: planParam, billing: billingParam } = await searchParams;
  const tier: Tier = planParam === "agency" ? "agency" : "pro";
  const billing: Billing = billingParam === "monthly" ? "monthly" : "annual";

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/signup?plan=${tier}%26billing=${billing}`);
  }

  const currentPlan = await getUserPlan(user.id);
  if (hasProAccess(currentPlan)) {
    redirect("/dashboard");
  }

  const details = PLAN_DETAILS[tier];
  const priceLabel =
    billing === "annual"
      ? `$${details.annual}/year`
      : `$${details.monthly}/month`;
  const savings =
    billing === "annual"
      ? `Save $${details.monthly * 12 - details.annual} vs. monthly`
      : null;

  return (
    <>
      <SiteNavMinimal />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <section
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "var(--space-10) var(--page-gutter)",
          }}
        >
          <p style={{ marginBottom: "var(--space-3)" }}>
            <Link
              href='/pricing'
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--carolina)",
                textDecoration: "none",
              }}
            >
              ← Back to pricing
            </Link>
          </p>

          <span
            style={{
              display: "inline-block",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--carolina)",
              marginBottom: "var(--space-2)",
            }}
          >
            14-day free trial
          </span>
          <h1 className='heading-1' style={{ marginBottom: "var(--space-3)" }}>
            Start your {details.name} trial.
          </h1>
          <p
            className='text-md'
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-6)",
              lineHeight: 1.5,
            }}
          >
            You won&apos;t be charged for 14 days. Cancel anytime before then
            and you pay nothing.
          </p>

          <div
            style={{
              padding: "var(--space-5)",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              marginBottom: "var(--space-5)",
            }}
          >
            <SummaryRow label='Plan' value={details.name} />
            <SummaryRow
              label='Billing'
              value={billing === "annual" ? "Annual" : "Monthly"}
            />
            <SummaryRow
              label='Price after trial'
              value={priceLabel}
              highlight
            />
            {savings && <SummaryRow label='' value={savings} subtle />}
            <SummaryRow label='Today' value='$0' />
          </div>

          <StartTrialButton tier={tier} billing={billing} />

          <p
            style={{
              marginTop: "var(--space-4)",
              fontSize: "var(--text-xs)",
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            You&apos;ll be redirected to PayPal to authorize the subscription.
            We never see or store your card details. Your account upgrades
            automatically once PayPal confirms the trial.
          </p>
        </section>
      </main>
      <SiteFooterMinimal />
    </>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  subtle,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "var(--space-2) 0",
        borderBottom: subtle ? "none" : "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: highlight ? "var(--text-lg)" : "var(--text-sm)",
          fontWeight: highlight ? 700 : 500,
          color: highlight
            ? "var(--text)"
            : subtle
              ? "var(--status-green)"
              : "var(--text)",
          fontFamily: subtle ? "var(--font-mono)" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}
