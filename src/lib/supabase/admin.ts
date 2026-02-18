import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL belum diset");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset");

  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (...args) => fetch(...args) }, // paksa pakai fetch Node
  });
}
