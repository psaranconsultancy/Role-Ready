import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { Session } from "./contracts.ts";

export function userClient(request: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !anonKey || !authorization) throw new Error("unauthorized");
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ownedSession(
  client: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<Session | null> {
  const { data, error } = await client.from("sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error) throw error;
  if (!data || data.user_id !== userId) return null;
  return data as Session;
}
