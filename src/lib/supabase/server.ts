import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const store = await cookies(); // Next 16: cookies() async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ boleh baca cookie
        getAll() {
          return store.getAll();
        },

        // ✅ di Server Component: JANGAN set/remove cookie (Next akan error)
        setAll() {
          // no-op
        },
      },
    }
  );
}