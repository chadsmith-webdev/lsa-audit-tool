import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createBrowserClient as _createBrowserClient,
  createServerClient as _createServerClient,
} from "@supabase/ssr";

// ─── Service role client (API routes / server-side DB writes) ─────────────────
// Bypasses RLS. Never expose this key to the browser.

let _serviceClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  _serviceClient = createClient(url, key);
  return _serviceClient;
}

// ─── Browser client (Client Components) ──────────────────────────────────────
// Uses anon key. Reads/writes session from cookies automatically.

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return _createBrowserClient(url, key);
}

// ─── Server client (Server Components, middleware) ────────────────────────────
// Uses anon key + cookie store. Refreshes session server-side.

export function createServerClient(
  cookieStore: {
    getAll(): { name: string; value: string }[];
    set(name: string, value: string, options?: object): void;
  },
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return _createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — cookies can't be set.
          // Middleware handles session refresh so this is safe to ignore.
        }
      },
    },
  });
}
