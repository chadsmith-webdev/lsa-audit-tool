"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient, getSupabase } from "@/lib/supabase";

export async function deleteAudit(auditId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Service role + explicit user_id guard — safe without relying on RLS
  const db = getSupabase();
  const { error } = await db
    .from("audits")
    .delete()
    .eq("id", auditId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
