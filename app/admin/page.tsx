import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use service role (same as auth callback) so RLS can't cause a false negative
  const db = getSupabase();
  const { data: profile } = await db
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  // Load all clients (non-admin profiles) with their latest audit
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, email, business_name, created_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  const { data: recentAudits } = await supabase
    .from("audits")
    .select("user_id, business_name, overall_score, created_at")
    .order("created_at", { ascending: false });

  // Build a map of user_id → latest audit
  const latestByUser: Record<
    string,
    { business_name: string; overall_score: number | null; created_at: string }
  > = {};
  for (const audit of recentAudits ?? []) {
    if (!latestByUser[audit.user_id]) {
      latestByUser[audit.user_id] = {
        business_name: audit.business_name,
        overall_score: audit.overall_score,
        created_at: audit.created_at,
      };
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "var(--space-8) var(--space-6)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "var(--space-8)" }}>
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--carolina)",
              marginBottom: "var(--space-2)",
            }}
          >
            Admin
          </p>
          <h1
            style={{
              fontSize: "var(--text-2xl)",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "var(--space-2)",
            }}
          >
            Client Portal
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
            {clients?.length ?? 0} active client
            {(clients?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Client list */}
        {!clients || clients.length === 0 ? (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-8)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
              No clients yet. Add an email to the invited_emails table to
              onboard your first client.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            {clients.map((client) => {
              const audit = latestByUser[client.id];
              const score = audit?.overall_score;
              const scoreColor =
                score == null
                  ? "var(--muted)"
                  : score >= 7
                    ? "var(--status-green)"
                    : score >= 4
                      ? "var(--status-yellow)"
                      : "var(--status-red)";

              return (
                <div
                  key={client.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-4) var(--space-5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-4)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--text)",
                        fontSize: "var(--text-sm)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {audit?.business_name ??
                        client.business_name ??
                        client.email}
                    </p>
                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      {client.email}
                      {audit
                        ? ` · Last audit ${new Date(audit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : " · No audits yet"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-4)",
                      flexShrink: 0,
                    }}
                  >
                    {score != null && (
                      <div style={{ textAlign: "center" }}>
                        <p
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: 700,
                            color: scoreColor,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {score.toFixed(1)}
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--muted)",
                          }}
                        >
                          score
                        </p>
                      </div>
                    )}
                    <a
                      href={`/admin/client/${client.id}`}
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: "var(--carolina)",
                        textDecoration: "none",
                        padding: "var(--space-2) var(--space-3)",
                        border: "1px solid rgba(123,175,212,0.3)",
                        borderRadius: "var(--radius-md)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      View Dashboard →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick actions */}
        <div
          style={{
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "var(--space-4)",
            }}
          >
            Quick Actions
          </p>
          <div
            style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}
          >
            <Link
              href='/dashboard'
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--carolina)",
                textDecoration: "none",
              }}
            >
              My Dashboard →
            </Link>
            <Link
              href='/audit'
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--carolina)",
                textDecoration: "none",
              }}
            >
              Run New Audit →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
