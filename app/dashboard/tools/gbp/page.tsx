import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { requireProAccess } from "@/lib/require-pro";
import {
  detectGbpFixes,
  rowFromAudit,
  sortFixes,
} from "@/lib/tools/gbp-optimizer";
import GbpFixList from "./GbpFixList";
import DescriptionRewriter from "./DescriptionRewriter";
import WeeklyPosts from "./WeeklyPosts";
import GbpConnection from "./GbpConnection";

export const metadata: Metadata = {
  title: "GBP Optimizer — Local Search Ally",
  description:
    "Auto-detect missing hours, photos, reviews, and posts on your Google Business Profile.",
};

export default async function GbpToolPage({
  searchParams,
}: {
  searchParams: Promise<{ gbp?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await requireProAccess(user.id, "gbp");

  const { gbp: gbpStatus } = await searchParams;

  // TODO: paid-tier gate. For now any signed-in user can access.

  const db = getSupabase();
  const [{ data: latest }, { data: connection }] = await Promise.all([
    db
      .from("audits")
      .select(
        "id, created_at, business_name, trade, city, gbp_found, gbp_rating, gbp_review_count, gbp_photo_count, gbp_has_hours",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    db
      .from("gbp_connections")
      .select("google_email, account_id, location_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Resolve location title via Google (best-effort, never blocks the page).
  let locationTitle: string | null = null;
  if (connection?.location_id) {
    try {
      const { getAccessTokenForUser } = await import("@/lib/gbp-api");
      const token = await getAccessTokenForUser(user.id);
      const res = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${connection.location_id}?readMask=title`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = (await res.json()) as { title?: string };
        locationTitle = data.title ?? null;
      }
    } catch {
      // Ignore — UI just shows the resource name fallback.
    }
  }

  const canWriteToGbp = Boolean(
    connection?.account_id && connection?.location_id,
  );

  if (!latest) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <main
          style={{
            maxWidth: "780px",
            margin: "0 auto",
            padding: "var(--space-10) var(--page-gutter)",
          }}
        >
          <p style={{ marginBottom: "var(--space-3)" }}>
            <Link
              href='/dashboard'
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--carolina)",
                textDecoration: "none",
              }}
            >
              ← Dashboard
            </Link>
          </p>
          <h1 className='heading-1' style={{ marginBottom: "var(--space-3)" }}>
            GBP Optimizer
          </h1>
          <p className='text-small' style={{ marginBottom: "var(--space-6)" }}>
            Run an audit first so we know what to fix.
          </p>
          <Link href='/' className='btn btn-primary'>
            Run a free audit →
          </Link>
        </main>
      </div>
    );
  }

  const fixes = sortFixes(detectGbpFixes(rowFromAudit(latest)));
  const auditDate = new Date(latest.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <main
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          padding: "var(--space-10) var(--page-gutter)",
        }}
      >
        <p style={{ marginBottom: "var(--space-3)" }}>
          <Link
            href='/dashboard'
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--carolina)",
              textDecoration: "none",
            }}
          >
            ← Dashboard
          </Link>
        </p>

        <header style={{ marginBottom: "var(--space-8)" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--carolina)",
              marginBottom: "var(--space-2)",
            }}
          >
            Pro Tool
          </span>
          <h1 className='heading-1' style={{ marginBottom: "var(--space-2)" }}>
            GBP Optimizer
          </h1>
          <p className='text-small' style={{ color: "var(--text-secondary)" }}>
            Based on your audit of <strong>{latest.business_name}</strong> on{" "}
            {auditDate}.{" "}
            <Link
              href='/'
              style={{ color: "var(--carolina)", textDecoration: "none" }}
            >
              Re-run audit →
            </Link>
          </p>
        </header>

        <GbpConnection
          connected={Boolean(connection)}
          googleEmail={connection?.google_email ?? null}
          status={gbpStatus ?? null}
          selectedLocationName={connection?.location_id ?? null}
          selectedLocationTitle={locationTitle}
        />

        {fixes.length === 0 ? (
          <div
            className='card card-default'
            style={{ padding: "var(--space-8)", textAlign: "center" }}
          >
            <h2
              className='heading-3'
              style={{ marginBottom: "var(--space-2)" }}
            >
              Nothing to fix.
            </h2>
            <p className='text-small'>
              Your Google Business Profile looks dialed in. Re-run the audit in
              30 days to catch drift.
            </p>
          </div>
        ) : (
          <GbpFixList fixes={fixes} auditId={latest.id} />
        )}

        <DescriptionRewriter
          auditId={latest.id}
          canApplyToGbp={canWriteToGbp}
        />
        <WeeklyPosts auditId={latest.id} canPostToGbp={canWriteToGbp} />
      </main>
    </div>
  );
}
