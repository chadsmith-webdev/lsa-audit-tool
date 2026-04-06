import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SharedAuditView from "./SharedAuditView";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

async function getAudit(id: string) {
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

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
