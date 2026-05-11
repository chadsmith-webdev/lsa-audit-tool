import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { getUserPlan, hasProAccess } from "@/lib/subscription";
import StartTrialButton from "./StartTrialButton";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import landingStyles from "@/styles/landing.module.css";
import styles from "@/styles/signup.module.css";

export const metadata: Metadata = {
  title: "Start Free Trial — Local Search Ally",
  description:
    "Start your 14-day Pro trial. No charge for 14 days. Cancel anytime.",
};

type Tier = "pro" | "multi_location";
type Billing = "monthly" | "annual";

const PLAN_DETAILS: Record<
  Tier,
  { name: string; monthly: number; annual: number }
> = {
  pro: { name: "Pro", monthly: 49, annual: 432 },
  multi_location: { name: "Multi-Location", monthly: 199, annual: 1788 },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  const { plan: planParam, billing: billingParam } = await searchParams;
  const tier: Tier = planParam === "multi_location" ? "multi_location" : "pro";
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
      <main className={`${landingStyles.mainContent} ${styles.main}`}>
        <section className={styles.section}>
          <p className={styles.backLinkWrap}>
            <Link href='/pricing' className={styles.backLink}>
              ← Back to pricing
            </Link>
          </p>

          <span className={styles.eyebrow}>14-day free trial</span>
          <h1 className={`heading-1 ${styles.heading}`}>
            Start your {details.name} trial.
          </h1>
          <p className={`text-md ${styles.lede}`}>
            You won&apos;t be charged for 14 days. Cancel anytime before then
            and you pay nothing.
          </p>

          <div className={styles.summaryCard}>
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

          <p className={styles.disclaimer}>
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
  const valueClass = highlight
    ? styles.rowValueHighlight
    : subtle
      ? styles.rowValueSubtle
      : styles.rowValue;
  return (
    <div className={`${styles.row} ${subtle ? styles.rowSubtle : ""}`}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
