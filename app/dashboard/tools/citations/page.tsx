import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { requireProAccess } from "@/lib/require-pro";
import CitationBuilder from "./CitationBuilder";

export const metadata: Metadata = {
  title: "Citation Builder — Local Search Ally",
  description:
    "The 20 directories that move the needle for local contractors, with ready-to-paste descriptions.",
};

export default async function CitationsToolPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await requireProAccess(user.id, "citations");

  const db = getSupabase();
  const { data: latest } = await db
    .from("audits")
    .select("id, created_at, business_name, input")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

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
            Citation Builder
          </h1>
          <p className='text-small' style={{ marginBottom: "var(--space-6)" }}>
            Run an audit first so we have your business context.
          </p>
          <Link href='/' className='btn btn-primary'>
            Run a free audit →
          </Link>
        </main>
      </div>
    );
  }

  const auditDate = new Date(latest.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const inputObj =
    latest.input && typeof latest.input === "object"
      ? (latest.input as {
          phone?: string;
          address?: string;
          websiteUrl?: string;
        })
      : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <main
        style={{
          maxWidth: "880px",
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
            Citation Builder
          </h1>
          <p className='text-small' style={{ color: "var(--text-secondary)" }}>
            For <strong>{latest.business_name}</strong> · audit from {auditDate}
            .
          </p>
        </header>

        <CitationBuilder
          auditId={latest.id}
          defaultPhone={inputObj?.phone ?? null}
          defaultAddress={inputObj?.address ?? null}
          defaultWebsite={inputObj?.websiteUrl ?? null}
        />
      </main>
    </div>
  );
}
