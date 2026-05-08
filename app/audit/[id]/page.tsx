import { notFound } from "next/navigation";
import { cache } from "react";
import { getSupabase } from "@/lib/supabase";
import SharedAuditView from "./SharedAuditView";
import type { Metadata } from "next";

// ─── Public audit view ────────────────────────────────────────────────────────
// Any UUID at /audit/[id] resolves to the matching audit row — no auth check.
// This is intentional: the shareable URL IS the access mechanism. Audits are
// non-sensitive (trade + score), and this is a lead-gen tool — we want them
// shared freely. UUIDs are unguessable; no enumeration attack is practical.
// Do NOT add an auth check here without a clear product reason.

type Props = {
  params: Promise<{ id: string }>;
};

// cache() deduplicates — generateMetadata and the page component both call
// getAudit(id), but Next.js only makes one Supabase round-trip per render.
const getAudit = cache(async (id: string) => {
  const { data, error } = await getSupabase()
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) {
    return { title: "Audit Not Found | Local Search Ally" };
  }
  return {
    title: `${audit.business_name} — Local SEO Audit | Local Search Ally`,
    description: `${audit.business_name} scored ${audit.overall_score}/10 on their local SEO audit. See the full breakdown.`,
  };
}

export default async function AuditPage({ params }: Props) {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) notFound();

  return (
    <main className='flex flex-1 flex-col'>
      <SharedAuditView audit={audit} />
    </main>
  );
}
