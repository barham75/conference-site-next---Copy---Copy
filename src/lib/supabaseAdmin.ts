import { createClient } from "@supabase/supabase-js";

// لا نعمل createClient إذا env ناقصة حتى لا ينهار build/runtime
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      ok: false as const,
      error:
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.",
      client: null,
    };
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return { ok: true as const, error: null, client };
}
