import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import LoginForm from "./LoginForm";
import styles from "@/styles/login.module.css";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 100 100'
            className={styles.logoSvg}
            aria-hidden='true'
          >
            <defs>
              <linearGradient
                id='needleGrad'
                x1='0'
                x2='1'
                gradientUnits='objectBoundingBox'
              >
                <stop offset='0' stopColor='white' stopOpacity='0.5' />
                <stop offset='0.45' stopColor='white' stopOpacity='1' />
                <stop offset='1' stopColor='white' stopOpacity='0.35' />
              </linearGradient>
              <clipPath id='ballClip'>
                <circle cx='50' cy='33' r='20' />
              </clipPath>
            </defs>
            <polygon points='48,52 52,52 50,93' fill='url(#needleGrad)' />
            <circle cx='50' cy='33' r='20' fill='#7bafd4' />
            <g clipPath='url(#ballClip)'>
              <circle cx='46' cy='28' r='10' fill='white' opacity='0.88' />
              <circle cx='49.5' cy='30.5' r='10.1' fill='#7bafd4' />
            </g>
          </svg>
          <span className={styles.logoText}>
            Local Search <span className={styles.logoAccent}>Ally</span>
          </span>
        </div>

        {/* Card */}
        <div className={`card card-default ${styles.card}`}>
          <h1 className={`heading-3 ${styles.heading}`}>
            Sign in to your dashboard
          </h1>
          <p className={`text-small ${styles.subhead}`}>
            Enter your email and we&apos;ll send you a sign-in link — no
            password needed.
          </p>

          {error === "auth_failed" && (
            <div className={styles.errorBanner}>
              <p className={styles.errorText}>
                That link has expired or already been used. Request a new one
                below.
              </p>
            </div>
          )}

          <LoginForm />
        </div>

        <p className={`text-small ${styles.footer}`}>
          Don&apos;t have an account?{" "}
          <Link href='/' className={styles.footerLink}>
            Run a free audit first
          </Link>
        </p>
      </div>
    </main>
  );
}
