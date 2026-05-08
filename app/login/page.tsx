import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Local Search Ally Audit Tool",
  description: "Sign in to access your local SEO dashboard.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-6) var(--page-gutter)",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: "28px", height: "28px", flexShrink: 0 }} aria-hidden="true">
            <defs>
              <linearGradient id="needleGrad" x1="0" x2="1" gradientUnits="objectBoundingBox">
                <stop offset="0" stopColor="white" stopOpacity="0.5" />
                <stop offset="0.45" stopColor="white" stopOpacity="1" />
                <stop offset="1" stopColor="white" stopOpacity="0.35" />
              </linearGradient>
              <clipPath id="ballClip">
                <circle cx="50" cy="33" r="20" />
              </clipPath>
            </defs>
            <polygon points="48,52 52,52 50,93" fill="url(#needleGrad)" />
            <circle cx="50" cy="33" r="20" fill="#7bafd4" />
            <g clipPath="url(#ballClip)">
              <circle cx="46" cy="28" r="10" fill="white" opacity="0.88" />
              <circle cx="49.5" cy="30.5" r="10.1" fill="#7bafd4" />
            </g>
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--text)", letterSpacing: "-0.02em" }}>
            Local Search <span style={{ color: "var(--carolina)" }}>Ally</span>
          </span>
        </div>

        {/* Card */}
        <div className="card card-default" style={{ padding: "var(--space-8)" }}>
          <h1 className="heading-3" style={{ marginBottom: "var(--space-2)" }}>
            Sign in to your dashboard
          </h1>
          <p className="text-small" style={{ marginBottom: "var(--space-6)" }}>
            Enter your email and we'll send you a sign-in link — no password needed.
          </p>

          {error === "auth_failed" && (
            <div style={{
              padding: "var(--space-3) var(--space-4)",
              background: "rgba(255,77,77,0.08)",
              border: "1px solid rgba(255,77,77,0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-5)",
            }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--status-red)" }}>
                That link has expired or already been used. Request a new one below.
              </p>
            </div>
          )}

          <LoginForm />
        </div>

        <p className="text-small" style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
          Don't have an account?{" "}
          <a href="/" style={{ color: "var(--carolina)" }}>
            Run a free audit first
          </a>
        </p>

      </div>
    </main>
  );
}
