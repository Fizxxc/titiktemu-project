"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function GoogleButton({
  label = "Lanjut dengan Google",
  next = "/",
}: {
  label?: string;
  next?: string;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={busy}
      className={[
        "w-full rounded-xl2 border border-black/10 bg-white",
        "px-4 py-3 text-sm font-semibold",
        "hover:bg-black/5 transition",
        "flex items-center justify-center gap-2",
      ].join(" ")}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white">
        G
      </span>
      {busy ? "Mengalihkan…" : label}
    </button>
  );
}
