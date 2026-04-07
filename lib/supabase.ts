import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  _client = createClient(url, key);
  return _client;
}

/** @deprecated import getSupabase() instead */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
